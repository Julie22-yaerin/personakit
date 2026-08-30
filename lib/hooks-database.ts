/**
 * 100-Hooks Database for Founder-Led Content & AI Persona Classification.
 * Based on the comprehensive behavioral psychology research in harness/framework/100-hooks-database.md.
 */

export interface HookEntry {
  code: string; // e.g. "#001"
  category: "appearance" | "movement" | "voice" | "word" | "editing" | "rage_bait" | "complex";
  categoryLabel: string;
  stage: "ideation" | "building" | "marketing" | "series_a" | "series_b" | "series_c" | "all_stages";
  stageLabel: string;
  personaTags: string[];
  scenario: string;
  spokenHookExample?: string;
  actionCues: string;
  psychologicalMechanism: string;
  algorithmicImpact: string;
}

export const HOOKS_DATABASE: HookEntry[] = [
  // --- Appearance Hooks ---
  {
    code: "#001",
    category: "appearance",
    categoryLabel: "Diện mạo & Bối cảnh",
    stage: "ideation",
    stageLabel: "Ideation",
    personaTags: ["Obsessive Thinker", "Garage Hacker"],
    scenario: "Tóc rối, áo thun phai màu, quầng thâm mắt dưới ánh sáng đèn bàn yếu ớt.",
    spokenHookExample: "Tôi vừa thức trắng 48 tiếng để tìm ra một lỗi mà đáng lẽ không nên tồn tại.",
    actionCues: "Ánh đèn bàn vàng mờ, góc quay cận mặt mệt mỏi nhưng ánh mắt sáng rực.",
    psychologicalMechanism: "Nguyên mẫu Hacker (Hacker Archetype) truyền tải sự cống hiến nhận thức tuyệt đối.",
    algorithmicImpact: "Dừng cuộn tức thì (Thumbstop rate cao) nhờ tính chân thực thô ráp.",
  },
  {
    code: "#002",
    category: "appearance",
    categoryLabel: "Diện mạo & Bối cảnh",
    stage: "ideation",
    stageLabel: "Ideation",
    personaTags: ["High Energy Ideator", "Endurance Athlete"],
    scenario: "Mặc đồ tập gym ướt đẫm mồ hôi, vừa thở dốc vừa nói ngay trên máy chạy bộ.",
    spokenHookExample: "Ý tưởng kiếm 1 triệu đô đầu tiên đến lúc tôi kiệt sức nhất ở cây số thứ 15.",
    actionCues: "Vừa lau mồ hôi bằng khăn vừa nhìn thẳng vào camera, nhịp thở dồn dập.",
    psychologicalMechanism: "Tín hiệu về sự kỷ luật, endorphin rush tạo ra cảm giác cấp bách cho ý tưởng.",
    algorithmicImpact: "Tăng tỷ lệ giữ chân 3 giây đầu (Hook rate) nhờ năng lượng động lực học.",
  },
  {
    code: "#005",
    category: "appearance",
    categoryLabel: "Diện mạo & Bối cảnh",
    stage: "building",
    stageLabel: "Building",
    personaTags: ["Deep Work Specialist", "Tech Savant"],
    scenario: "Đeo kính chống ánh sáng xanh, màn hình phản chiếu mã lệnh chớp nhoáng lên tròng kính.",
    spokenHookExample: "Mọi người nghĩ code AI phức tạp, nhưng đoạn code này chỉ có đúng 12 dòng.",
    actionCues: "Phản chiếu terminal code xanh lá lên tròng kính, ánh sáng phòng tối.",
    psychologicalMechanism: "Ngôn ngữ hình ảnh Cyberpunk, biến nhà sáng lập thành cỗ máy xử lý dữ liệu đáng tin cậy.",
    algorithmicImpact: "Thu hút khán giả chuyên môn kỹ thuật, kéo dài thời gian xem trung bình.",
  },
  {
    code: "#008",
    category: "appearance",
    categoryLabel: "Diện mạo & Bối cảnh",
    stage: "marketing",
    stageLabel: "Marketing",
    personaTags: ["Cheeky Challenger", "Brand Warrior"],
    scenario: "Cầm một tách cà phê có in logo của công ty đối thủ nhưng đã bị gạch chéo bằng bút lông đen.",
    spokenHookExample: "Tại sao giải pháp của đối thủ trị giá 1 tỷ đô lại vô dụng với bạn?",
    actionCues: "Cầm cốc quay logo bị gạch chéo về phía ống kính, nhấp ngụm cà phê thản nhiên.",
    psychologicalMechanism: "Sợi dây thị giác gây hấn mang tính biểu tượng, truyền tải sự tự tin của kẻ thách thức.",
    algorithmicImpact: "Tạo ra thảo luận so sánh thương hiệu, giữ chân người xem ở lại lâu hơn.",
  },

  // --- Movement Hooks ---
  {
    code: "#016",
    category: "movement",
    categoryLabel: "Chuyển động & Động năng",
    stage: "ideation",
    stageLabel: "Ideation",
    personaTags: ["Iconoclast", "Aggressive Rebel"],
    scenario: "Ném mạnh một quyển sách kinh doanh nổi tiếng vào thùng rác ngay giây đầu.",
    spokenHookExample: "Hãy vứt cuốn sách này đi nếu bạn muốn thực sự sống sót năm nay.",
    actionCues: "Ném cuốn sách nghe tiếng 'bộp' vào thùng rác kim loại, nhìn xoáy vào camera.",
    psychologicalMechanism: "Báng bổ thần tượng (Iconoclasm). Não bộ bị sốc trước hành vi từ chối biểu tượng quen thuộc.",
    algorithmicImpact: "Tăng vọt tỷ lệ chú ý 3 giây đầu (Hook rate), kích thích sự chia rẽ trong bình luận.",
  },
  {
    code: "#018",
    category: "movement",
    categoryLabel: "Chuyển động & Động năng",
    stage: "building",
    stageLabel: "Building",
    personaTags: ["Agile Executor", "Action Biased"],
    scenario: "Xé toạc một bản kế hoạch kinh doanh in trên giấy thành nhiều mảnh nhỏ rồi tung lên không trung.",
    spokenHookExample: "Kế hoạch 5 năm của bạn đã lỗi thời ngay từ khi bạn in nó ra.",
    actionCues: "Hai tay xé toang tờ giấy A4, tung mảnh vụn lên không trung trước ống kính.",
    psychologicalMechanism: "Chuyển động hủy diệt (Destructive motion). Thay đổi trạng thái vật lý tạo sự thỏa mãn thị giác.",
    algorithmicImpact: "Giữ chân người xem chờ đợi lời giải thích cho hành động phá hoại, kéo dài Dwell time.",
  },
  {
    code: "#023",
    category: "movement",
    categoryLabel: "Chuyển động & Động năng",
    stage: "series_a",
    stageLabel: "Series A",
    personaTags: ["Simplifier", "Core Truth Seeker"],
    scenario: "Dùng bút lông xóa gạch chéo một chuỗi các con số 0 trên bảng, biến 1.000.000 thành 1.",
    spokenHookExample: "Chúng tôi không cần 1 triệu người dùng ảo. Chúng tôi chỉ cần đúng 1 chỉ số này.",
    actionCues: "Gạch mạnh bút đỏ xóa bay các số 0 trên bảng trắng, khoanh tròn số 1.",
    psychologicalMechanism: "Chuyển động loại bỏ sự dư thừa truyền tải triết lý tối giản hóa mạnh mẽ.",
    algorithmicImpact: "Hình ảnh biến đổi số liệu trở nên dễ nhớ, thúc đẩy tỷ lệ lưu trữ (Saves).",
  },

  // --- Voice / Auditory Hooks ---
  {
    code: "#031",
    category: "voice",
    categoryLabel: "Âm thanh & Tông giọng",
    stage: "ideation",
    stageLabel: "Ideation",
    personaTags: ["Conspiracy Theorist", "Whistleblower"],
    scenario: "Thì thầm sát vào micro nhỏ, ánh mắt láo liên nhìn xung quanh như đang tiết lộ bí mật quốc gia.",
    spokenHookExample: "Đừng nói cho sếp của bạn biết điều này...",
    actionCues: "Kéo sát micro cài áo lên sát miệng, nói giọng thì thầm kịch tính.",
    psychologicalMechanism: "Tâm lý học về sự cấm đoán và bí mật (Forbidden knowledge).",
    algorithmicImpact: "Ép người xem bật âm lượng tối đa hoặc dừng cuộn để nghe rõ lời thì thầm.",
  },
  {
    code: "#033",
    category: "voice",
    categoryLabel: "Âm thanh & Tông giọng",
    stage: "building",
    stageLabel: "Building",
    personaTags: ["Stoic Operator", "Cold Realist"],
    scenario: "Im lặng hoàn toàn trong 3 giây đầu, chỉ có tiếng gõ bàn phím cơ dồn dập vang lên.",
    spokenHookExample: "Nếu bạn vẫn đang dùng bảng tính để quản lý khách hàng, bạn đang tự sát.",
    actionCues: "3 giây đầu hoàn toàn không nói, chỉ gõ phím cơ clicky lách cách, rồi bất ngờ ngẩng đầu nhìn vào camera.",
    psychologicalMechanism: "Khoảng lặng thính giác (Auditory silence) tạo sự tương phản mạnh mẽ với luồng tin tức ồn ào.",
    algorithmicImpact: "Tỷ lệ vượt qua 3 giây đầu tuyệt đối nhờ cảm giác căng thẳng được xây dựng bằng âm thanh.",
  },
  {
    code: "#037",
    category: "voice",
    categoryLabel: "Âm thanh & Tông giọng",
    stage: "marketing",
    stageLabel: "Marketing",
    personaTags: ["High Intensity Closer", "Urgent Commander"],
    scenario: "Nói cực nhanh không ngắt nghỉ với âm lượng lớn như một chỉ huy chiến trường đang giao nhiệm vụ.",
    spokenHookExample: "Dừng lại! Đừng chi thêm 1 đồng nào cho quảng cáo Facebook nếu bạn chưa làm 3 điều này!",
    actionCues: "Cúi sát người về phía trước, ánh mắt đanh thép, ngón tay nhịp mạnh theo từng từ.",
    psychologicalMechanism: "Kích hoạt hạch hạnh nhân (Amygdala activation) qua tín hiệu âm thanh báo động khẩn cấp.",
    algorithmicImpact: "Giữ tỷ lệ hoàn thành (Completion rate) cao nhờ nhịp điệu nhanh dồn dập.",
  },

  // --- Word / Cognitive Hooks ---
  {
    code: "#046",
    category: "word",
    categoryLabel: "Từ ngữ & Nghịch lý",
    stage: "ideation",
    stageLabel: "Ideation",
    personaTags: ["Contrarian Thinker", "Paradox Finder"],
    scenario: "Khẳng định một điều ngược lại hoàn toàn với niềm tin phổ biến của 99% người trong ngành.",
    spokenHookExample: "Ý tưởng khởi nghiệp càng hay thì tỷ lệ phá sản càng cao. Đây là lý do.",
    actionCues: "Ngồi khoanh tay điềm tĩnh, nhìn thẳng vào mắt người xem với nụ cười nhẹ đầy tự tin.",
    psychologicalMechanism: "Sự bất hòa nhận thức (Cognitive dissonance) buộc não bộ phải tìm lời giải thích.",
    algorithmicImpact: "Bùng nổ bình luận tranh luận giữa 2 luồng quan điểm trái chiều.",
  },
  {
    code: "#048",
    category: "word",
    categoryLabel: "Từ ngữ & Nghịch lý",
    stage: "building",
    stageLabel: "Building",
    personaTags: ["Transparent Builder", "Vulnerable Leader"],
    scenario: "Công khai một thất bại đau đớn hoặc một con số tài chính tồi tệ mà không giấu giếm.",
    spokenHookExample: "Tháng trước tôi vừa mất trắng 200 triệu đồng chỉ vì 1 dòng code sai.",
    actionCues: "Để lộ màn hình dashboard tài chính đỏ rực, thở hắt ra một hơi chân thành.",
    psychologicalMechanism: "Hiệu ứng Pratfall (Pratfall effect) làm tăng mức độ đáng tin cậy của chuyên gia khi để lộ điểm yếu.",
    algorithmicImpact: "Chỉ số Chiều sâu (Depth Score) cao nhất nhờ sự đồng cảm sâu sắc và tỷ lệ chia sẻ lớn.",
  },
  {
    code: "#051",
    category: "word",
    categoryLabel: "Từ ngữ & Nghịch lý",
    stage: "marketing",
    stageLabel: "Marketing",
    personaTags: ["System Architect", "Cheatsheet Giver"],
    scenario: "Hứa hẹn một quy trình từng bước hoặc một bản tài liệu cô đọng giải quyết dứt điểm nỗi đau.",
    spokenHookExample: "Đây là toàn bộ quy trình 3 bước tôi dùng để chốt deal 50.000$ đầu tiên mà không cần quảng cáo.",
    actionCues: "Giơ tờ checklist hoặc tài liệu 1 trang lên trước camera rồi chỉ vào từng mục.",
    psychologicalMechanism: "Khao khát đường tắt (Shortcut bias) và nhận thức về giá trị thông tin ngay lập tức.",
    algorithmicImpact: "Tỷ lệ lưu trữ (Saves) và chia sẻ (Shares) đạt mức tối đa.",
  },

  // --- Rage Bait / Strategic Polarization Hooks ---
  {
    code: "#076",
    category: "rage_bait",
    categoryLabel: "Phân cực & Khiêu khích",
    stage: "ideation",
    stageLabel: "Ideation",
    personaTags: ["High Ego Disruptor", "Provocateur"],
    scenario: "Tấn công thẳng thắn vào một thói quen hoặc công cụ mà cả ngành đang tôn thờ.",
    spokenHookExample: "Bằng đại học ngành quản trị kinh doanh là thứ lãng phí tiền bạc nhất tôi từng thấy.",
    actionCues: "Vừa lắc đầu vừa cười khẩy, giọng điệu châm biếm sâu cay.",
    psychologicalMechanism: "Thiên kiến tiêu cực (Negativity bias) và phản xạ tự vệ bản ngã của nhóm người bị động chạm.",
    algorithmicImpact: "Lượng bình luận phản bác và bảo vệ khổng lồ, thuật toán liên tục phân phối lại.",
  },
  {
    code: "#080",
    category: "rage_bait",
    categoryLabel: "Phân cực & Khiêu khích",
    stage: "marketing",
    stageLabel: "Marketing",
    personaTags: ["Ruthless Meritocrat", "Hard Truth Teller"],
    scenario: "Vạch trần một ảo tưởng làm giàu hoặc một lời khuyên kinh doanh sáo rỗng trên mạng.",
    spokenHookExample: "Lý do bạn chưa kiếm được 10.000$/tháng không phải vì thiếu vốn, mà vì sản phẩm của bạn quá tệ.",
    actionCues: "Nhìn thẳng không chớp mắt, ngắt từng chữ chắc nịch không do dự.",
    psychologicalMechanism: "Đánh trúng nỗi sợ hãi bất tài (Incompetence fear) kết hợp với mong muốn chứng minh bản thân.",
    algorithmicImpact: "Dwell time cực cao vì người xem tức giận muốn nghe hết để tìm kẽ hở phản bác.",
  },

  // --- Multimodal & Complex Hooks ---
  {
    code: "#091",
    category: "complex",
    categoryLabel: "Đa phương thức Phức hợp",
    stage: "ideation",
    stageLabel: "Ideation",
    personaTags: ["Disillusioned Creator", "Radical Truth Teller"],
    scenario: "Kéo rèm cửa sổ cho ánh sáng chói lòa tràn vào + Thở dài mệt mỏi + 'Sự thật về thu nhập thụ động là nó không hề thụ động.'",
    spokenHookExample: "Sự thật về thu nhập thụ động là nó không hề thụ động một chút nào.",
    actionCues: "Kéo phắt rèm cửa cho ánh sáng chói vào camera, thở dài mệt mỏi rồi quay lại nhìn thẳng ống kính.",
    psychologicalMechanism: "Đánh thức đa giác quan: Ánh sáng mạnh gây sốc thị giác, tiếng thở dài tạo đồng cảm, thông điệp phủ định dối trá.",
    algorithmicImpact: "Tạo lực tương tác bùng nổ, dễ dàng vượt qua bài kiểm tra chất lượng ban đầu của AI.",
  },
  {
    code: "#092",
    category: "complex",
    categoryLabel: "Đa phương thức Phức hợp",
    stage: "building",
    stageLabel: "Building",
    personaTags: ["High Energy Fixer", "Tactical Nerd"],
    scenario: "Zoom giật cục vào một biểu đồ đang đi xuống + Tốc độ nói cực nhanh + 'Hệ thống vừa sập, và đây là cách tôi sửa trong 5 phút.'",
    spokenHookExample: "Hệ thống của chúng tôi vừa sập hoàn toàn. Đây là cách tôi sửa nó trong đúng 5 phút.",
    actionCues: "Camera zoom giật vào màn hình log lỗi đỏ rực, sau đó chuyển nhanh sang mặt founder đang thao tác bàn phím.",
    psychologicalMechanism: "Cảm giác khủng hoảng cấp tính. Sự kết hợp tốc độ hình ảnh và âm thanh ép não bộ tập trung cao độ.",
    algorithmicImpact: "Tỷ lệ giữ chân 3s tuyệt đối, lượng Saves khổng lồ do chứa quy trình xử lý sự cố.",
  },
  {
    code: "#097",
    category: "complex",
    categoryLabel: "Đa phương thức Phức hợp",
    stage: "all_stages",
    stageLabel: "All Stages",
    personaTags: ["Provocative Analyst", "Myth Buster"],
    scenario: "Cầm điện thoại chỉ vào một bài báo giật gân + Giọng nhếch mép châm biếm + 'AI sẽ không lấy đi công việc của bạn. Người biết dùng AI sẽ làm điều đó.'",
    spokenHookExample: "AI sẽ không cướp việc của bạn. Những người biết dùng AI như thế này mới là người làm điều đó.",
    actionCues: "Cầm điện thoại đưa sát màn hình bài báo vào ống kính, sau đó kéo về nhìn thẳng người xem với nụ cười tự tin.",
    psychologicalMechanism: "Sự chỉ điểm vật lý tập trung ánh nhìn, thông điệp đánh vào nỗi sợ hãi thời đại.",
    algorithmicImpact: "Bùng nổ chia sẻ đa nền tảng vì tính thời sự và tính ứng dụng cao.",
  },
  {
    code: "#099",
    category: "complex",
    categoryLabel: "Đa phương thức Phức hợp",
    stage: "series_a",
    stageLabel: "Series A / Growth",
    personaTags: ["Transparent Leader", "Data Evangelist"],
    scenario: "Màn hình hiển thị dashboard tài chính đỏ rực + Đặt tay lên trán thở dài + 'Dòng tiền của chúng tôi đang chảy máu. Đây là nhật ký cứu sống công ty.'",
    spokenHookExample: "Dòng tiền của chúng tôi đang chảy máu tuần thứ ba liên tiếp. Đây là nhật ký sống còn.",
    actionCues: "Quay màn hình đồ thị burn rate, đặt tay lên trán thở dài, sau đó nhìn vào camera với ánh mắt kiên định.",
    psychologicalMechanism: "Tính chân thực thô ráp kết hợp số liệu kinh doanh cụ thể, tạo cam kết theo dõi series.",
    algorithmicImpact: "Tỷ lệ Follows sau khi xem cực cao vì muốn theo dõi kết quả của chuỗi nhật ký.",
  },
];

export function getAllHooks(): HookEntry[] {
  return HOOKS_DATABASE;
}

export function getHookByCode(code: string): HookEntry | undefined {
  const norm = code.startsWith("#") ? code : `#${code}`;
  return HOOKS_DATABASE.find((h) => h.code.toLowerCase() === norm.toLowerCase());
}

export function getHooksByStage(stage: HookEntry["stage"]): HookEntry[] {
  return HOOKS_DATABASE.filter((h) => h.stage === stage || h.stage === "all_stages");
}

export function searchHooks(query: string): HookEntry[] {
  const q = query.toLowerCase().trim();
  if (!q) return HOOKS_DATABASE;
  return HOOKS_DATABASE.filter(
    (h) =>
      h.code.toLowerCase().includes(q) ||
      h.categoryLabel.toLowerCase().includes(q) ||
      h.scenario.toLowerCase().includes(q) ||
      (h.spokenHookExample && h.spokenHookExample.toLowerCase().includes(q)) ||
      h.personaTags.some((t) => t.toLowerCase().includes(q)) ||
      h.psychologicalMechanism.toLowerCase().includes(q),
  );
}

export function recommendHooksForContext(topic: string, founderKeywords: string[] = []): HookEntry[] {
  const allTerms = [topic, ...founderKeywords].join(" ").toLowerCase();
  const scored = HOOKS_DATABASE.map((h) => {
    let score = 0;
    for (const tag of h.personaTags) {
      if (allTerms.includes(tag.toLowerCase())) score += 3;
    }
    if (allTerms.includes(h.category)) score += 2;
    if (allTerms.includes("ai") || allTerms.includes("code") || allTerms.includes("tech") || allTerms.includes("kỹ thuật")) {
      if (h.personaTags.includes("Tech Savant") || h.personaTags.includes("Tactical Nerd") || h.code === "#097") {
        score += 4;
      }
    }
    if (allTerms.includes("tiền") || allTerms.includes("vốn") || allTerms.includes("doanh thu") || allTerms.includes("deal")) {
      if (h.code === "#048" || h.code === "#051" || h.code === "#099") score += 4;
    }
    if (allTerms.includes("phản biện") || allTerms.includes("tranh cãi") || allTerms.includes("ngược đời") || allTerms.includes("thực tế")) {
      if (h.category === "rage_bait" || h.personaTags.includes("Contrarian Thinker")) score += 4;
    }
    return { hook: h, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, 4).map((s) => s.hook);
}
