#!/usr/bin/env python3
"""Sinh lịch nội dung 14 ngày từ framework Founder-led GTM.

Usage:
    python3 generate_calendar.py --model b2c --stage prepmf --product "App học tập cho Gen Z"
    python3 generate_calendar.py --model b2b --stage mvp --state state.json
"""
import argparse
import datetime as dt
import json
import sys

STRATEGY = {
    "b2b": {
        "prepmf": ("Build in Public", "Waitlist", "Kêu gọi theo dõi hành trình + đóng góp ý kiến xây dựng"),
        "mvp": ("Trojan Horse / Tactical Teardown", "Beta testing & Early Adopters", "Lead magnet đổi email lấy quyền truy cập sớm"),
        "scaling": ("Thought Leadership", "Lịch hẹn Demo (inbound leads)", "Case Study chi tiết (ROI, MRR) qua Email Nurturing"),
    },
    "b2c": {
        "prepmf": ("Phân cực & Câu chuyện cá nhân", "Micro-Community", "Kéo vào group Discord/Zalo kín"),
        "mvp": ("Serendipity - A Day in the Life", "Tải app / đăng ký dùng thử", "Link in bio zero-friction capture"),
        "scaling": ("Viral Engineering (UGC)", "Viral loops & mass adoption", "Referral program + kiểm soát khủng hoảng minh bạch"),
    },
}

VISUALS = {
    ("b2b", "prepmf"): ["Ảnh sổ tay/mindmap chiến lược", "Biểu đồ so sánh hiện trạng ngành", "Screenshot feedback ban đầu"],
    ("b2b", "mvp"): ["Video Loom quay màn hình workflow", "Carousel hướng dẫn từng bước", "Ảnh check-in với khách đầu tiên"],
    ("b2b", "scaling"): ["Data viz hiệu suất", "Infographic tiết kiệm thời gian/tiền", "Ảnh sân khấu/sự kiện chuyên ngành"],
    ("b2c", "prepmf"): ["Vlog nhật ký thô ít chỉnh sửa", "Bối cảnh chân thực (bàn học, quán cà phê)", "Text hook mạnh 3 giây đầu"],
    ("b2c", "mvp"): ["Fast-cut video", "Góc quay over-the-shoulder thao tác thật", "Trending audio"],
    ("b2c", "scaling"): ["Split-screen trước/sau khi dùng", "Memes/internet culture graphics", "Video react của Founder"],
}

# Chu kỳ luân phiên 6 bài (2 tuần)
POST_CYCLE = [
    "Founders' Story",
    "Tactical Teardown",
    "Strong Opinion",
    "Industry Observation",
    "Founders' Story",
    "Tactical Teardown",
]


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", choices=["b2b", "b2c"], required=False)
    ap.add_argument("--stage", choices=["prepmf", "mvp", "scaling"], required=False)
    ap.add_argument("--product", default="<điền sản phẩm>")
    ap.add_argument("--start", help="Ngày bắt đầu YYYY-MM-DD (mặc định thứ Hai tuần tới)")
    ap.add_argument("--state", help="Đọc model/stage/product từ file JSON")
    args = ap.parse_args()

    model, stage, product = args.model, args.stage, args.product
    if args.state:
        with open(args.state) as f:
            s = json.load(f)
        model = model or s.get("model")
        stage = stage or s.get("stage")
        product = s.get("product", product)

    if not model or not stage or model == "both":
        sys.exit("Thiếu --model (b2b|b2c) hoặc --stage (prepmf|mvp|scaling)")

    if args.start:
        start = dt.date.fromisoformat(args.start)
    else:
        today = dt.date.today()
        start = today + dt.timedelta(days=(7 - today.weekday()) % 7 or 7)

    strategy_name, goal, action = STRATEGY[model][stage]
    visuals = VISUALS[(model, stage)]

    lines = [
        f"# Content Calendar 14 ngày — {model.upper()} / {stage}",
        "",
        f"- **Sản phẩm**: {product}",
        f"- **Chiến lược cốt lõi**: {strategy_name}",
        f"- **Mục tiêu phễu**: {goal}",
        f"- **Hành động chuyển đổi**: {action}",
        "- **Nhịp đăng**: Thứ 2 – Thứ 4 – Thứ 6 | Trực bình luận 4 giờ vàng sau mỗi bài",
        "",
    ]

    post_idx = 0
    for week in range(2):
        lines.append(f"## Tuần {week + 1}")
        for dow in (0, 2, 4):  # Mon, Wed, Fri
            day = start + dt.timedelta(days=week * 7 + dow)
            v = visuals[post_idx % len(visuals)]
            lines += [
                f"### {day.strftime('%a %d/%m')} — Bài {post_idx + 1} — Post Type: {POST_CYCLE[post_idx]}",
                f"- Hook (3 giây đầu): <viết hook gắn với '{strategy_name}'>",
                f"- Ý chính: <1 chủ đề cụ thể, kiểm tra đúng 80/20>",
                f"- Visual: {v}",
                f"- CTA: {action}",
                "",
            ]
            post_idx += 1

    lines += [
        "---",
        "**Self-check cuối**: tỷ lệ nội dung nói về sản phẩm ≤20%? Kẻ thù chung rõ ràng? Sản phẩm là công cụ sinh tồn chứ không phải trung tâm?",
    ]
    print("\n".join(lines))
    return 0


if __name__ == "__main__":
    sys.exit(main())
