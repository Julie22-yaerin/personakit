# Founder-Led GTM Harness

Khung vận hành (operating system) để nạp cho **bất kỳ AI nào** (Claude, GPT, Gemini, open-source models — qua API hoặc chat) đóng vai trò **Cố vấn Chiến lược GTM & Nội dung Founder-led**.

AI sau khi nạp harness này sẽ tự động:
1. Chẩn đoán giai đoạn startup của founder (Pre-PMF / MVP / Scaling).
2. Xác định mô hình thị trường (B2B / B2C).
3. Sinh ra: roadmap nội dung, đề xuất visual, chiến thuật chuyển đổi (phễu), lịch trình 14 ngày.

## Cấu trúc

```
harness/
├── AGENTS.md                    # Hướng dẫn vận hành cho AI agent (nạp đầu tiên)
├── SYSTEM_PROMPT.md             # System prompt phổ quát, dán vào bất kỳ API nào
├── framework/
│   ├── core-rules.md            # 3 quy tắc tối thượng (80/20, Phân cực, Ngựa gỗ Troy)
│   ├── b2b-roadmap.md           # Module 1: lộ trình B2B
│   ├── b2c-roadmap.md           # Module 2: lộ trình B2C
│   ├── content-calendar-system.md # Module 3: lịch trình & 4 kiểu mẫu bài đăng
│   └── state.schema.json        # Schema trạng thái dự án AI đọc/ghi
├── templates/
│   ├── post-types.md            # 4 mẫu bài đăng + quy tắc thực thi
│   └── calendar-template.md     # Khung lịch 14 ngày trống
├── examples/
│   └── calendar-b2b-prepmf-14day.md  # Ví dụ lịch 14 ngày đã sinh
└── tools/
    └── generate_calendar.py     # Sinh lịch 14 ngày từ state.json
```

## Cách nạp cho AI (API-agnostic)

### Cách 1 — Chat thủ công (ChatGPT, Claude.ai, Gemini...)
Dán nội dung `SYSTEM_PROMPT.md` làm tin nhắn đầu tiên, rồi mô tả dự án của bạn theo schema `framework/state.schema.json`.

### Cách 2 — API (OpenAI-compatible, Anthropic, v.v.)
```python
system_prompt = open("harness/SYSTEM_PROMPT.md").read()
# Anthropic
client.messages.create(system=system_prompt, ...)
# OpenAI-compatible
client.chat.completions.create(messages=[{"role": "system", "content": system_prompt}], ...)
```

### Cách 3 — Coding agent (Claude Code, opencode, Cursor...)
Trỏ agent đọc `harness/AGENTS.md` trước khi thực hiện bất kỳ tác vụ nào liên quan đến GTM/nội dung.

## Quy trình chuẩn khi hỏi AI

```
1. Cung cấp state (giai đoạn, mô hình, nền tảng, sản phẩm)
2. AI chẩn đoán → chọn module (B2B/B2C) + phase
3. AI xuất: chiến lược + visual suggestions + phễu chuyển đổi
4. AI sinh lịch nội dung (mặc định 14 ngày, 3 bài/tuần)
5. AI ghi lại thay đổi vào state.json (nếu chạy agent có filesystem)
```
