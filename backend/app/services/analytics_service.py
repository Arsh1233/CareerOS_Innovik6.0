from __future__ import annotations

from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor, as_completed

from app.repositories.analytics import AnalyticsRepository
from app.schemas.analytics import (
    CollegeDashboard,
    StudentMetric,
    DepartmentMetric,
    AdminDashboard,
    UserMetric,
    CollegeMetric,
    RecruiterMetric,
)


class AnalyticsService:
    def __init__(self, repository: AnalyticsRepository) -> None:
        self.repository = repository

    def get_college_dashboard(self, college_id: str) -> CollegeDashboard:
        # ── Step 1: fetch students + recruiter count in parallel ─────────
        with ThreadPoolExecutor(max_workers=2) as pool:
            future_students = pool.submit(self.repository.get_college_students, college_id)
            future_recruiters = pool.submit(self.repository.count_active_recruiters)
            students_data = future_students.result()
            active_recruiters = future_recruiters.result()

        # ── Step 2: fetch twin scores (depends on user_ids from step 1) ──
        user_ids = [s["profiles"]["user_id"] for s in students_data if s.get("profiles")]
        scores = self.repository.get_latest_twins_for_users(user_ids)

        # ── Step 3: aggregate ─────────────────────────────────────────────
        students = []
        dept_stats: dict = defaultdict(lambda: {"students": 0, "readiness_sum": 0, "placed": 0, "atRisk": 0})
        job_ready = 0
        at_risk = 0

        for s in students_data:
            prof = s.get("profiles") or {}
            uid = prof.get("user_id")
            dept = s.get("department") or "Unknown"
            score = scores.get(uid, 0)

            status = s.get("enrollment_status", "active")
            issue = None
            if score >= 75:
                if score >= 90:
                    status = "placed"
                job_ready += 1
            elif 0 < score < 50:
                status = "at-risk"
                at_risk += 1
                issue = "Low readiness score"

            students.append(
                StudentMetric(
                    name=prof.get("display_name") or "Unknown",
                    email=prof.get("email") or "Unknown",
                    department=dept,
                    readiness=score,
                    status=status,
                    issue=issue,
                )
            )

            ds = dept_stats[dept]
            ds["students"] += 1
            ds["readiness_sum"] += score
            if status == "placed":
                ds["placed"] += 1
            if status == "at-risk":
                ds["atRisk"] += 1

        department_metrics = [
            DepartmentMetric(
                dept=d_name,
                students=ds["students"],
                readiness=int(ds["readiness_sum"] / ds["students"]) if ds["students"] else 0,
                placed=ds["placed"],
                atRisk=ds["atRisk"],
            )
            for d_name, ds in dept_stats.items()
        ]

        return CollegeDashboard(
            total_students=len(students),
            job_ready_students=job_ready,
            at_risk_students=at_risk,
            active_recruiters=active_recruiters,
            department_metrics=department_metrics,
            students=students,
        )

    def get_admin_dashboard(self) -> AdminDashboard:
        # ── Fetch all 5 datasets in parallel ──────────────────────────────
        with ThreadPoolExecutor(max_workers=5) as pool:
            future_users = pool.submit(self.repository.get_all_profiles)
            future_colleges = pool.submit(self.repository.get_all_colleges)
            future_recruiters = pool.submit(self.repository.get_all_recruiters)
            future_memberships = pool.submit(self.repository.get_all_org_memberships)
            future_counts = pool.submit(self.repository.count_students_in_colleges)

            users_data = future_users.result()
            colleges_data = future_colleges.result()
            recruiters_data = future_recruiters.result()
            memberships_data = future_memberships.result()
            student_counts = future_counts.result()

        # Build lookup: user_id -> membership row
        membership_by_user: dict[str, dict] = {}
        for m in memberships_data:
            uid = m.get("user_id")
            if uid and uid not in membership_by_user:
                membership_by_user[uid] = m

        users = []
        for u in users_data:
            uid = u.get("user_id", "")
            role = "student"
            m = membership_by_user.get(uid, {})
            if m.get("college_id"):
                role = "college"
            elif m.get("recruiter_organization_id"):
                role = "recruiter"

            dt = u.get("created_at", "2026-09-01T00:00:00Z")[:10]
            users.append(
                UserMetric(
                    name=u.get("display_name") or "Unknown",
                    email=u.get("email") or "Unknown",
                    role=role,  # type: ignore
                    status="active",
                    college=None,
                    joined=dt,
                )
            )

        colleges = []
        for c in colleges_data:
            cid = c.get("id")
            active_count = student_counts.get(cid, 0)
            dt = c.get("created_at", "2026-09-01T00:00:00Z")[:10]
            colleges.append(
                CollegeMetric(
                    name=c.get("name") or "Unknown",
                    city=c.get("city"),
                    students=active_count,
                    active=active_count,
                    readiness=0,
                    status=c.get("verified_status") or "pending",
                    joinDate=dt,
                )
            )

        recruiters = []
        for r in recruiters_data:
            dt = r.get("created_at", "2026-09-01T00:00:00Z")[:10]
            recruiters.append(
                RecruiterMetric(
                    name=r.get("name") or "Unknown",
                    contact=None,
                    roles=0,
                    hires=0,
                    plan="Enterprise",
                    status=r.get("verified_status") or "pending",
                    since=dt,
                )
            )

        return AdminDashboard(
            total_users=len(users_data),
            active_colleges=sum(1 for c in colleges if c.status == "verified"),
            active_recruiters=sum(1 for r in recruiters if r.status == "verified"),
            users=users,
            colleges=colleges,
            recruiters=recruiters,
        )
