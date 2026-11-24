import type { CollectorSourceInfo } from "./site";
import type { MerchItem, OfflineEvent, RedeemCode } from "./types";
import type { AppLang } from "../lib/i18n";
import { ARCHIVE_EVENT_I18N, ARCHIVE_MERCH_I18N, patchExtraSource } from "./archiveLocalizedData";

/**
 * Strictly verified official in-game Zenless Zone Zero nomenclature across JA / KO / EN:
 * - Game: ゼンレスゾーンゼロ / 젠레스 존 제로 / Zenless Zone Zero
 * - Ver.3.4: ついには長き、日の終わり / 긴 나날의 끝자락 / The Finality of the Day
 * - Sunbringer: サンブリンガー / 태양을 가져온 자 / Sunbringer (結使 / 결사 / Enchainer, 虚狩り / 공허 사냥꾼 / Void Hunter)
 * - Robin: ロビン / 로빈 / Robin; Kafka: カフカ / 카프카 / Kafka; Pom-Pom: パム / 폼폼 / Pom-Pom
 * - Ukinami Yuzuha: 浮波柚葉 / 우키나미 유즈하 / Ukinami Yuzuha (怪啖屋 / 괴담방 / Spook Shack)
 * - Yixuan: 儀玄 / 의현 / Yixuan (雲嶽山 / 운규산 / Yunkui Summit)
 * - Hoshimi Miyabi: 星見雅 / 호시미 미야비 / Hoshimi Miyabi (対ホロウ6課 / 대공동 6과 / Section 6)
 * - Astra Yao: アストラ・ヤオ / 아스트라 야오 / Astra Yao (スターズ・オブ・リラ / 스타즈 오브 리라 / Stars of Lyra)
 * - Ellen Joe: エレン・ジョー / 엘렌 조 / Ellen Joe; Von Lycaon: フォン・ライカン / 본・리카온 / Von Lycaon (ヴィクトリア家政 / 빅토리아 하우스키핑 / Victoria Housekeeping Co.)
 * - Angels of Delusion: 妄想エンジェル / 엔젤디 / Angels of Delusion
 * - Currency/Items: ポリクローム / 폴리크롬 / Polychrome; 暗号化マスターテープ / 기밀 마스터 테이프 / Encrypted Master Tape; ボンプ / Bangboo / Bangboo
 */

type EventPatch = Partial<
  Pick<
    OfflineEvent,
    "title" | "subtitle" | "organizer" | "city" | "venue" | "dateRange" | "ticketStatus" | "highlights" | "description"
  >
>;

const EVENT_I18N: Record<Exclude<AppLang, "zh">, Record<string, EventPatch>> = {
  ja: {
    "ev-hz-fes-2026": {
      title: "『ゼンレスゾーンゼロ』2026 FES「布夢カーニバル」杭州大会展中心",
      subtitle: "年間最大級の公式オフラインフェス！3大展示ホール再現＋Ver.3.4先行試遊＋会場限定グッズ",
      organizer: "miHoYo · ゼンレスゾーンゼロ中国公式",
      city: "杭州",
      venue: "杭州大会展中心（ホール 4 / 5 / 6）",
      ticketStatus: "Bilibili 会員購 実名チケット・まもなく開幕",
      highlights: [
        "ホール4〜6に六分街・ビデオ屋「Random Play」や各陣営エリアを実寸大で再現",
        "Ver.3.4「ついには長き、日の終わり」先行試遊、クリエイターステージ、コスプレイヤーパレードを開催",
        "会場物販にて「布夢カーニバル」限定グッズ＆購入特典を初頒布",
      ],
      description:
        "2026年11月27日〜29日に杭州大会展中心で開催される年間最大級の公式大型オフラインフェス。Ver.3.4「ついには長き、日の終わり」先行試遊や会場限定グッズ販売を実施。",
    },
    "ev-zlive-2026": {
      title: "『ゼンレスゾーンゼロ』☆ Zenless LIVE 2026 —— FES スペシャルコンサート",
      subtitle: "杭州 FES 同時開催の夜間ライブ（17:30–22:00）！新エリー都を彩る公式大型音楽ステージ",
      organizer: "miHoYo · ゼンレスゾーンゼロ音楽チーム",
      city: "杭州",
      venue: "杭州大会展中心（ホール 5 & 6 音楽メインステージ）",
      dateRange: "2026.11.27 – 11.29 毎晩",
      ticketStatus: "チケット販売中・オンライン同時配信予定",
      highlights: [
        "3夜連続の豪華ステージで人気バトルBGMやエージェントEPを生演奏",
        "スターズ・オブ・リラ「アストラ・ヤオ」、妄想エンジェル、シーズン3主題歌の特別アレンジ披露",
      ],
      description:
        "杭州 FES と同日程の毎晩開催される公式大型音楽ライブ『Zenless LIVE 2026』。昼はフェス、夜はライブの一体型体験を提供。",
    },
    "ev-v34-hsr-collab": {
      title: "『ゼンレスゾーンゼロ』×『崩壊：スターレイル』Ver.3.4「ついには長き、日の終わり」3都市コラボポップアップ",
      subtitle: "最新大型IPコラボ！ログインでS級「ロビン」無料配布＋上海・成都・東京3都市期間限定ポップアップ",
      organizer: "miHoYo / HoYoverse 公式コラボ企画",
      city: "上海・成都・東京",
      venue: "上海 静安大悦城 / 成都 天府紅 / 東京 秋葉原",
      ticketStatus: "12月1日より時間指定事前予約開始",
      highlights: [
        "サンブリンガー、ロビン、カフカ、ボンプ「パム」の大型特設展示が登場",
        "来場・購入特典としてコラボ限定レーザーチケット＆記念ポストカードを配布",
      ],
      description:
        "12月2日配信のVer.3.4「ついには長き、日の終わり」に合わせ、上海・成都・東京の3都市で『崩壊：スターレイル』コラボポップアップを開催。",
    },
    "ev-hz-afterparty-2026": {
      title: "「新エリー都エレクトロナイト · Inter-Knot Night」杭州 FES 場外ファン DJ ライブ",
      subtitle: "杭州 FES 2日目の夜に開催される非公式ファン主催DJパーティー（OST・妄想エンジェル・EPリミックス）",
      organizer: "杭州プロキシ有志コミュニティ",
      city: "杭州",
      venue: "杭州 · 酒球会 Livehouse",
      ticketStatus: "前売チケット残りわずか・応援ペンライト付",
      description: "2026 杭州 FES 参加者向けに地元プロキシ有志が企画した非公式アフターパーティー。",
    },
    "ev-shanghai-only-2026": {
      title: "2026「六分街エコー」ゼンレスゾーンゼロ 同人オンリー即売会・上海",
      subtitle: "80以上の全陣営サークルが集結する非公式ファンオンリー即売会＆スタンプラリー",
      organizer: "六分街エコー同人実行委員会",
      city: "上海",
      venue: "上海 · 世貿展館 2F",
      ticketStatus: "CPP / Bilibili にて一般チケット販売中（¥68〜）",
      description: "邪兎屋、対ホロウ6課、カリュドーンの子、ヴィクトリア家政など陣営別ストリートを設けた非公式オンリー即売会。",
    },
    "ev-wuhan-yadea-2026": {
      title: "武漢歓楽谷 ×『ゼンレスゾーンゼロ』× 雅迪(Yadea) 第10回717サイクリングフェス",
      subtitle: "大型ブランドコラボ特設会場！ヴィクトリア家政「エレン・ジョー」「フォン・ライカン」＆ボンプ痛車4モデル実車展示",
      organizer: "ゼンレスゾーンゼロ中国公式 × Yadea × 武漢歓楽谷",
      city: "武漢",
      venue: "武漢歓楽谷 メイン会場",
      dateRange: "2026.07.18 開催（終了・コラボ電動バイクは販売継続）",
      ticketStatus: "会場イベント終了・全国Yadea店舗にてコラボ車販売中",
      description: "2026年夏に武漢歓楽谷で開催された Yadea 大型オフラインコラボ。Fairy カスタムUI搭載の4種のコラボ電動バイクを発表。",
    },
    "ev-kfc-2026": {
      title: "KFC ×『ゼンレスゾーンゼロ』大型フードコラボ：「妄想エンジェル」降臨 美味 On Air！",
      subtitle: "「妄想エンジェル」がメインビジュアルを務める全国KFCコラボ店舗・限定セットグッズ＆特典コード",
      organizer: "ゼンレスゾーンゼロ中国公式 × KFC",
      city: "中国全国テーマ店舗",
      venue: "全国 KFC コラボテーマ店舗",
      dateRange: "2026.07.10 – 08月（終了済みアーカイブ）",
      ticketStatus: "コラボ終了・公式アーカイブ保存",
      description: "2026年夏に実施された「妄想エンジェル」主役の KFC 全国コラボキャンペーン記録。",
    },
    "ev-zcombo-shanghai-2026": {
      title: "『ゼンレスゾーンゼロ』Z・COMBO サマーポップアップ（上海）",
      subtitle: "上海公式サマーポップアップ：フォトスポット・ボンプ展示・三Z STUDIO 新作物販",
      organizer: "ゼンレスゾーンゼロ中国公式",
      city: "上海",
      venue: "上海 · 鑫耀・光環 Live",
      dateRange: "2026.07.25 – 08.16（終了済み）",
      ticketStatus: "終了済み・公式アーカイブ",
      description: "2026年夏に上海で開催された公式大型ポップアップイベント。",
    },
    "ev-tokyo-delusion-live": {
      title: "東京「Signal Lost DJ Live」& 妄想エンジェル Z Live Tokyo 音楽企画",
      subtitle: "日本初の公式大型DJライブ＆「妄想エンジェル」テーマ音楽プロジェクト公式アーカイブ",
      organizer: "HoYoverse Japan（X @ZZZ_JP）",
      city: "東京",
      venue: "東京・豊洲 PIT (Toyosu PIT)",
      dateRange: "2026.03.09 – 03.10（終了済みアーカイブ）",
      ticketStatus: "公演終了・イベント＆グッズ記録保存",
      description: "2026年春に東京・豊洲 PIT で2夜開催された日本初の公式DJライブ『Signal Lost DJ Live』および妄想エンジェル関連企画の記録。",
    },
  },

  ko: {
    "ev-hz-fes-2026": {
      title: "〈젠레스 존 제로〉 2026 FES 「꿈의 카니발」 항저우 국제엑스포센터",
      subtitle: "연례 최대 규모 공식 오프라인 축제! 3개 전시관 실물 구현 + 3.4 버전 선행 시연 + 현장 한정 굿즈",
      organizer: "HoYoverse · 젠레스 존 제로 중국 공식",
      city: "항저우",
      venue: "항저우 국제엑스포센터 (4 / 5 / 6관)",
      ticketStatus: "Bilibili 실명 예매 · 개막 임박",
      highlights: [
        "4~6관에 6단지, Random Play 비디오 가게 및 각 진영 테마 구역 실물 구현",
        "3.4 버전 「긴 나날의 끝자락」 선행 시연, 개발진 무대 및 코스플레이어 퍼레이드",
        "공식 현장 스토어에서 「꿈의 카니발」 한정 굿즈 최초 판매",
      ],
      description: "2026년 11월 27~29일 항저우에서 열리는 연례 최대 공식 오프라인 페스티벌.",
    },
    "ev-zlive-2026": {
      title: "〈젠레스 존 제로〉 ☆ Zenless LIVE 2026 —— FES 스페셜 콘서트",
      subtitle: "항저우 FES 기간 매일 밤 17:30–22:00 진행되는 뉴에리두 공식 대형 음악 콘서트",
      organizer: "miHoYo · 젠레스 존 제로 음악 팀",
      city: "항저우",
      venue: "항저우 국제엑스포센터 (5 & 6관 메인 스테이지)",
      dateRange: "2026.11.27 – 11.29 매일 밤",
      ticketStatus: "예매 진행 중 · 온라인 동시 생중계 예정",
      highlights: [
        "3일 연속 대형 무대에서 인기 전투 OST 및 에이전트 EP 라이브 연주",
        "스타즈 오브 리라 「아스트라 야오」, 「엔젤디」 및 시즌 3 테마곡 스페셜 편곡",
      ],
      description: "항저우 FES와 동시 개최되는 공식 야간 음악 콘서트.",
    },
    "ev-v34-hsr-collab": {
      title: "〈젠레스 존 제로〉 × 〈붕괴: 스타레일〉 3.4 「긴 나날의 끝자락」 3개 도시 콜라보 팝업",
      subtitle: "최신 대형 콜라보! 로그인 시 S급 「로빈」 무료 지급 + 상하이/청두/도쿄 팝업스토어",
      organizer: "miHoYo / HoYoverse 공식 콜라보",
      city: "상하이 · 청두 · 도쿄",
      venue: "상하이 징안 조이시티 / 청두 톈푸홍 / 도쿄 아키하바라",
      ticketStatus: "12월 1일부터 사전 예약 오픈",
      highlights: [
        "태양을 가져온 자, 로빈, 카프카, Bangboo 「폼폼」 대형 포토존 전시",
        "현장 방문 및 구매 시 콜라보 한정 레이저 티켓·기념 엽서 증정",
      ],
      description: "12월 2일 3.4 「긴 나날의 끝자락」 출시에 맞춰 3개 도시에서 동시 개최되는 콜라보 팝업.",
    },
    "ev-hz-afterparty-2026": {
      title: "「뉴에리두 일렉트로 나이트 · Inter-Knot Night」 항저우 FES 팬 DJ 파티",
      subtitle: "항저우 FES 2일차 밤 팬 커뮤니티 자체 기획 애프터파티 (OST·엔젤디·EP 리믹스)",
      organizer: "항저우 로프꾼 팬 커뮤니티",
      city: "항저우",
      venue: "항저우 · 마오/지우치우후이 라이브하우스",
      ticketStatus: "예매 잔여 소량 · 응원봉 증정",
      description: "2026 항저우 FES 방문 로프꾼을 위한 비공식 팬 DJ 애프터파티.",
    },
    "ev-shanghai-only-2026": {
      title: "2026 「6단지의 메아리」 젠레스 존 제로 동인 온리전 · 상하이",
      subtitle: "80개 이상 동인 부스가 참여하는 화동 최대 비공식 온리전 & 스탬프 투어",
      organizer: "6단지의 메아리 동인 기획팀",
      city: "상하이",
      venue: "상하이 세계무역전시관 2F",
      ticketStatus: "CPP / Bilibili 예매 중 (¥68~)",
      description: "교토옥, 대공동 6과, 칼리돈의 자손, 빅토리아 하우스키핑 등 진영별 부스 구성.",
    },
    "ev-wuhan-yadea-2026": {
      title: "우한 해피밸리 × 〈젠레스 존 제로〉 × 야디(Yadea) 제10회 717 글로벌 라이딩 페스티벌",
      subtitle: "대형 오프라인 브랜드 콜라보! 빅토리아 하우스키핑 「엘렌 조」·「본・리카온」·Bangboo 커스텀 전기차 4종 전시",
      organizer: "젠레스 존 제로 중국 공식 × Yadea × 우한 해피밸리",
      city: "우한",
      venue: "우한 해피밸리 메인 행사장",
      dateRange: "2026.07.18 개최 (종료 · 콜라보 차량 판매 중)",
      ticketStatus: "오프라인 행사 종료 · 야디 매장 콜라보 모델 판매 지속",
      description: "2026년 여름 우한 해피밸리에서 개최된 대형 야디 콜라보 페스티벌 기록.",
    },
    "ev-kfc-2026": {
      title: "KFC × 〈젠레스 존 제로〉 대형 콜라보: 「엔젤디」 강림 맛있는 On Air!",
      subtitle: "「엔젤디」가 메인으로 참여한 전국 KFC 테마 매장, 한정 세트 굿즈 및 리딤코드",
      organizer: "젠레스 존 제로 중국 공식 × KFC",
      city: "중국 전국 테마 매장",
      venue: "전국 KFC 콜라보 테마 매장",
      dateRange: "2026.07.10 – 08월 (종료 아카이브)",
      ticketStatus: "콜라보 종료 · 공식 기록 보관",
      description: "2026년 여름 큰 화제를 모은 「엔젤디」 메인 KFC 대형 콜라보 기록.",
    },
    "ev-zcombo-shanghai-2026": {
      title: "〈젠레스 존 제로〉 Z·COMBO 서머 팝업 (상하이)",
      subtitle: "상하이 공식 대형 여름 팝업스토어: 포토존·Bangboo 전시 및 한정 굿즈 판매",
      organizer: "젠레스 존 제로 중국 공식",
      city: "상하이",
      venue: "상하이 신야오 광환 Live",
      dateRange: "2026.07.25 – 08.16 (종료)",
      ticketStatus: "종료됨 · 공식 아카이브",
      description: "2026년 여름 상하이에서 열린 공식 대형 팝업 기록.",
    },
    "ev-tokyo-delusion-live": {
      title: "도쿄 「Signal Lost DJ Live」 & 엔젤디 Z Live Tokyo 음악 프로젝트",
      subtitle: "일본 첫 공식 대형 DJ 라이브 및 「엔젤디」 테마 음악 프로젝트 아카이브",
      organizer: "HoYoverse Japan (X @ZZZ_JP)",
      city: "도쿄",
      venue: "도쿄 · 토요스 PIT (Toyosu PIT)",
      dateRange: "2026.03.09 – 03.10 (종료 아카이브)",
      ticketStatus: "공연 종료 · 아카이브 보관",
      description: "2026년 봄 도쿄 토요스 PIT에서 이틀간 개최된 일본 최초 공식 대형 DJ 라이브 기록.",
    },
  },

  en: {
    "ev-hz-fes-2026": {
      title: "Zenless Zone Zero 2026 FES — Hangzhou Grand Convention Center",
      subtitle: "Annual flagship official convention! 3 immersive halls + Ver. 3.4 hands-on demo + FES exclusive merch",
      organizer: "miHoYo · ZZZ China Official",
      city: "Hangzhou",
      venue: "Hangzhou Grand Convention Center (Halls 4 / 5 / 6)",
      ticketStatus: "Bilibili Ticketing · Opening Soon",
      highlights: [
        "Life-size Sixth Street, Random Play video store, and faction zones across Halls 4–6",
        'Playable Version 3.4 "The Finality of the Day" demo, creator stage & cosplay parade',
        "FES-exclusive merch debut and spend-tier commemorative bonuses on site",
      ],
      description:
        "The biggest annual official Zenless Zone Zero offline festival, held Nov 27–29, 2026 in Hangzhou with Ver. 3.4 playable booths and exclusive merch.",
    },
    "ev-zlive-2026": {
      title: "Zenless Zone Zero ☆ Zenless LIVE 2026 — FES Special Concert",
      subtitle: "Nightly 17:30–22:00 flagship music concert alongside Hangzhou FES 2026",
      organizer: "miHoYo · ZZZ Music Team",
      city: "Hangzhou",
      venue: "Hangzhou Grand Convention Center (Halls 5 & 6 Music Stage)",
      dateRange: "2026.11.27 – 11.29 Nightly",
      ticketStatus: "Tickets Open · Online Livestream Planned",
      highlights: [
        "3 consecutive nights featuring iconic ZZZ battle OSTs and Agent EPs live",
        "Special live arrangements for Astra Yao (Stars of Lyra), Angels of Delusion & Season 3 themes",
      ],
      description:
        "Official nightly concert series paired with Hangzhou FES 2026, bringing New Eridu's soundtrack to life.",
    },
    "ev-v34-hsr-collab": {
      title: 'Zenless Zone Zero × Honkai: Star Rail Ver. 3.4 "The Finality of the Day" Pop-Up',
      subtitle: "Brand-new crossover! Free S-Rank Robin on login + 3-city pop-up in Shanghai, Chengdu & Tokyo",
      organizer: "miHoYo / HoYoverse Official Collab",
      city: "Shanghai · Chengdu · Tokyo",
      venue: "Shanghai Joy City / Chengdu Tianfuhong / Tokyo Akihabara",
      ticketStatus: "Timed Reservation Opens Dec 1",
      highlights: [
        "Featuring life-size standees of Sunbringer, Robin, Kafka, and Bangboo Pom-Pom",
        "Exclusive holographic laser tickets & commemorative postcards for visitors",
      ],
      description:
        'Timed with the Dec 2 launch of Version 3.4 "The Finality of the Day", featuring themed crossover pop-ups across three cities.',
    },
    "ev-hz-afterparty-2026": {
      title: "Inter-Knot Night — Hangzhou FES Unofficial Fan DJ Live",
      subtitle: "Community-hosted DJ afterparty featuring ZZZ OST, Angels of Delusion & EP remixes",
      organizer: "Hangzhou Proxy Community",
      city: "Hangzhou",
      venue: "Hangzhou · Livehouse",
      ticketStatus: "Limited Pre-sale · Lightstick Included",
      description: "Fan-organized evening DJ party for Proxies attending Hangzhou FES 2026.",
    },
    "ev-shanghai-only-2026": {
      title: "2026 Sixth Street Echo — ZZZ Fan Only Expo (Shanghai)",
      subtitle: "Unofficial fan expo with 80+ artist booths across all New Eridu factions & stamp rally",
      organizer: "Sixth Street Echo Fan Committee",
      city: "Shanghai",
      venue: "ShanghaiMart Expo Hall 2F",
      ticketStatus: "Tickets on CPP / Bilibili (from ¥68)",
      description: "Fan-run Zenless Zone Zero Only convention featuring Cunning Hares, Section 6, Sons of Calydon & Victoria Housekeeping zones.",
    },
    "ev-wuhan-yadea-2026": {
      title: "Wuhan Happy Valley × Zenless Zone Zero × Yadea 717 Riding Festival",
      subtitle: "Major brand collab venue! 4 custom e-bikes for Ellen Joe, Von Lycaon & Bangboo",
      organizer: "ZZZ CN Official × Yadea × Wuhan Happy Valley",
      city: "Wuhan",
      venue: "Wuhan Happy Valley Main Venue",
      dateRange: "2026.07.18 (Ended · Collab E-Bikes On Sale)",
      ticketStatus: "Event Concluded · Collab E-Bikes Available Nationwide",
      description:
        "Summer 2026 flagship offline collaboration with Yadea showcasing 4 Victoria Housekeeping Co. & Bangboo custom e-bikes with Fairy dashboard UI.",
    },
    "ev-kfc-2026": {
      title: "KFC × Zenless Zone Zero Major Collab: Angels of Delusion On Air!",
      subtitle: "Nationwide KFC themed stores starring Angels of Delusion with merch bundles & in-game codes",
      organizer: "ZZZ CN Official × KFC",
      city: "Nationwide China",
      venue: "KFC × ZZZ Themed Stores",
      dateRange: "2026.07.10 – Aug (Archive)",
      ticketStatus: "Concluded · Official Archive",
      description: "Summer 2026 KFC nationwide collaboration starring Angels of Delusion.",
    },
    "ev-zcombo-shanghai-2026": {
      title: "Zenless Zone Zero Z·COMBO Summer Pop-Up (Shanghai)",
      subtitle: "Official Shanghai summer pop-up featuring Bangboo installations & ZZZ Studio drops",
      organizer: "ZZZ China Official",
      city: "Shanghai",
      venue: "Shanghai · Xinyao Halo Live",
      dateRange: "2026.07.25 – 08.16 (Archive)",
      ticketStatus: "Concluded · Official Archive",
      description: "Official summer pop-up landmark in Shanghai featuring seasonal ZZZ Studio merch.",
    },
    "ev-tokyo-delusion-live": {
      title: "Tokyo Signal Lost DJ Live & Angels of Delusion Z Live Tokyo",
      subtitle: "First official ZZZ major DJ concert in Japan & Angels of Delusion music project archive",
      organizer: "HoYoverse Japan (X @ZZZ_JP)",
      city: "Tokyo",
      venue: "Tokyo · Toyosu PIT",
      dateRange: "2026.03.09 – 03.10 (Archive)",
      ticketStatus: "Concluded · Event & Merch Archive",
      description: "Two-night official DJ Live concert at Toyosu PIT in Tokyo celebrating New Eridu music and Angels of Delusion.",
    },
  },
};

type MerchPatch = Partial<
  Pick<MerchItem, "name" | "series" | "characterOrFaction" | "summary" | "detailIntro" | "specs" | "channels">
>;

const MERCH_I18N: Record<Exclude<AppLang, "zh">, Record<string, MerchPatch>> = {
  ja: {
    "merch-hz-fes-2026": {
      name: "杭州 2026 FES「布夢カーニバル」& ZLIVE 会場限定グッズ",
      series: "2026 杭州 FES 初頒布",
      characterOrFaction: "全陣営・2026 FES",
      summary: "杭州大会展中心 FES ＆ Zenless LIVE 会場限定グッズ全ラインアップ（アクリルスタンド、缶バッジ、ペンライト等）。",
      detailIntro: "2026年11月27日〜29日の杭州 FES 会場物販にて初登場。購入金額に応じた限定特典付き。",
    },
    "merch-tidal-noise-kb": {
      name: "三Z STUDIO「Tidal Noise」カスタム3モード メカニカルキーボードセット",
      series: "三Z STUDIO デバイス・10月新作",
      characterOrFaction: "三Z STUDIO・デバイス",
      summary: "新エリー都ストリート美学を融合した3モード対応カスタムメカニカルキーボード＆キーキャップセット。",
      detailIntro: "有線・2.4GHz・Bluetooth 3モード対応、カスタム軸＆ボンプモチーフキーキャップ付属。",
    },
    "merch-yadea-ebikes": {
      name: "雅迪(Yadea) ×『ゼンレスゾーンゼロ』コラボ電動バイク全4種（エレン・ジョー / フォン・ライカン / ボンプ）",
      series: "Yadea 公式大型ブランドコラボ",
      characterOrFaction: "ヴィクトリア家政・ボンプ",
      summary: "エレン・ジョー、フォン・ライカン、ボンプモチーフの4モデル。Fairy 専用UI＆起動ボイス搭載。",
      detailIntro: "武漢歓楽谷717フェスで発表。ヴィクトリア家政デザインと専用アクセサリー特典を同梱。",
    },
    "merch-yuzuha-figure": {
      name: "陣営シリーズ 怪啖屋「浮波柚葉」1/7スケール 塗装済み完成品フィギュア",
      series: "陣営シリーズ 1/7 フィギュア",
      characterOrFaction: "浮波柚葉・怪啖屋",
      summary: "怪啖屋エージェント「浮波柚葉」を1/7スケールで立体化。特徴的な傘や衣装の質感を精巧に再現。",
      detailIntro: "公式原型監修による1/7完成品フィギュア。公式予約特典付き。",
    },
    "merch-yixuan-figure": {
      name: "LIMEPIEシリーズ 雲嶽山「儀玄」1/8スケールフィギュア 墨形影踪Ver.",
      series: "LIMEPIE 1/8 フィギュアライン",
      characterOrFaction: "儀玄・雲嶽山",
      summary: "雲嶽山の宗師「儀玄」が LIMEPIE 1/8スケールで登場。水墨エフェクトと躍動感ある造形が魅力。",
      detailIntro: "手に取りやすい価格帯ながら細部までこだわった LIMEPIE 1/8 スケールフィギュア。",
    },
    "merch-delusion-controller": {
      name: "「妄想エンジェル・連携の刻」Apex 6 Pro 触覚フィードバック コントローラーギフトBOX",
      series: "三Z STUDIO × Flydigi コラボデバイス",
      characterOrFaction: "妄想エンジェル",
      summary: "「妄想エンジェル」特別デザインのフラッグシップ無線コントローラー＆限定特典BOX。",
      detailIntro: "力覚フィードバックトリガー・カスタムディスプレイに妄想エンジェル専用アニメーションを収録。",
    },
    "merch-2026aw-apparel": {
      name: "三Z STUDIO 2026AW ストリートアパレル & 協奏バンド / HB2U 誕生日セット",
      series: "三Z STUDIO 2026 秋冬企画",
      characterOrFaction: "三Z STUDIO・2026AW",
      summary: "秋冬アウター・パーカー・バッグに加え、エージェント誕生日記念「HB2U」グッズが一挙登場。",
      detailIntro: "日常使いしやすい新エリー都ストリート系デザインのアパレル＆キャラクターグッズ新作。",
    },
    "merch-delusion-earbuds": {
      name: "「妄想エンジェル・シャイニング」イヤーカフ型ワイヤレスイヤホン＆アパレルシリーズ",
      series: "妄想エンジェル企画・オーディオ＆アパレル",
      characterOrFaction: "妄想エンジェル",
      summary: "「妄想エンジェル」コラボ イヤーカフ型Bluetoothイヤホン（限定ボイス収録）＆アパレル各種。",
      detailIntro: "軽量オープンイヤー設計に妄想エンジェル専用システム音声を内蔵。",
    },
    "merch-bangboo-fruit-blindbox": {
      name: "「ボンプ フルーツ＆ベジタブル王国」ビニールぬいぐるみキーホルダー ブラインドBOX",
      series: "ボンプ 定期新作ブラインドBOX",
      characterOrFaction: "人気ボンプ・ブラインド",
      summary: "フルーツ姿の人気ボンプたちが可愛いぬいぐるみマスコット＆ミニフィギュアになって登場。",
      detailIntro: "全6種＋シークレット1種。バッグチャームとして持ち歩ける日常定期人気シリーズ。",
    },
    "merch-astra-miyabi-figures": {
      name: "スターズ・オブ・リラ「アストラ・ヤオ」1/7 & LIMEPIE「星見雅」1/8 暁Ver. フィギュア",
      series: "S級エージェント プレミアムフィギュア",
      characterOrFaction: "アストラ・ヤオ / 星見雅",
      summary: "大人気S級エージェント「アストラ・ヤオ」（1/7）と対ホロウ6課「星見雅」（1/8）の豪華フィギュア。",
      detailIntro: "新エリー都の歌姫「アストラ・ヤオ」と虚狩り「星見雅」の美麗造形を公式詳図で確認可能。",
    },
    "merch-rapid-power-pro": {
      name: "「急速電力 Pro シリーズ」140W GaN 充電器 / モジュラーモバイルバッテリー / 240W ケーブル",
      series: "公式ガジェット・急速充電シリーズ",
      characterOrFaction: "急速電力 Pro・デジタル",
      summary: "140W 3ポート GaN 充電器、組み換え式モバイルバッテリーなど新エリー都デザインの本格ガジェット。",
      detailIntro: "ノートPC・スマホ・携帯ゲーム機の同時急速充電に対応した公式デジタル周辺機器。",
    },
    "merch-v34-bundle": {
      name: "Ver.3.4「ついには長き、日の終わり」サンブリンガー & ロビン 新作アクスタ・缶バッジ予告",
      series: "Ver.3.4 連動新作・予約注目",
      characterOrFaction: "サンブリンガー / ロビン / パム",
      summary: "Ver.3.4 配信に合わせて登場予定の「サンブリンガー」「ロビン」＆ボンプ「パム」公式グッズ。",
      detailIntro: "12月2日バージョン更新に連動して米遊舗・公式ショップにて順次公開予定。",
    },
  },

  ko: {
    "merch-hz-fes-2026": {
      name: "항저우 2026 FES 「꿈의 카니발」 & ZLIVE 현장 한정 굿즈",
      series: "2026 항저우 FES 현장 최초 공개",
      characterOrFaction: "전체 진영 · 2026 FES",
      summary: "항저우 FES 및 Zenless LIVE 현장 스토어 한정 아크릴 스탠드, 배지, 응원봉 풀 라인업.",
      detailIntro: "2026년 11월 27~29일 항저우 FES 현장 스토어 최초 발매 및 구매 금액별 특전 증정.",
    },
    "merch-tidal-noise-kb": {
      name: "삼Z STUDIO 「Tidal Noise」 커스텀 3모드 기계식 키보드 세트",
      series: "삼Z STUDIO 플래그십 주변기기",
      characterOrFaction: "삼Z STUDIO · 주변기기",
      summary: "뉴에리두 스트릿 감성을 담은 3모드 커스텀 기계식 키보드 및 테마 키캡 세트.",
      detailIntro: "유선·2.4GHz·블루투스 3모드 지원 및 Bangboo 포인트 키캡 포함.",
    },
    "merch-yadea-ebikes": {
      name: "야디(Yadea) × 〈젠레스 존 제로〉 콜라보 전기 스쿠터 4종 (엘렌 조 / 본・리카온 / Bangboo)",
      series: "야디 공식 브랜드 콜라보",
      characterOrFaction: "빅토리아 하우스키핑 · Bangboo",
      summary: "엘렌 조, 본・리카온, Bangboo 테마 커스텀 전기차 4종. Fairy 전용 UI 및 시동 보이스 탑재.",
      detailIntro: "우한 해피밸리 717 페스티벌 공개, 전국 야디 공식 매장 판매 지속.",
    },
    "merch-yuzuha-figure": {
      name: "진영 시리즈 괴담방 「우키나미 유즈하」 1/7 스케일 도색 완성품 피규어",
      series: "진영 시리즈 1/7 피규어",
      characterOrFaction: "우키나미 유즈하 · 괴담방",
      summary: "괴담방 에이전트 「우키나미 유즈하」 1/7 스케일 피규어. 우산과 의상 디테일을 정교하게 구현.",
      detailIntro: "공식 감수 1/7 완성품 피규어, 공식 예약 특전 포함.",
    },
    "merch-yixuan-figure": {
      name: "LIMEPIE 시리즈 운규산 「의현」 1/8 피규어 묵형영종 Ver.",
      series: "LIMEPIE 1/8 피규어 라인",
      characterOrFaction: "의현 · 운규산",
      summary: "운규산 종사 「의현」 1/8 스케일 피규어. 수묵 이펙트와 역동적인 조형이 특징.",
      detailIntro: "합리적인 가격대와 높은 디테일을 겸비한 LIMEPIE 1/8 스케일 시리즈.",
    },
    "merch-delusion-controller": {
      name: "「엔젤디 · 콤보 타임」 에이펙스 6 Pro 햅틱 컨트롤러 기프트 박스",
      series: "삼Z STUDIO × 플라이디지 콜라보",
      characterOrFaction: "엔젤디 · 주변기기",
      summary: "「엔젤디」 테마 플래그십 무선 게임패드 & 한정 특전 패키지.",
      detailIntro: "포스 피드백 트리거와 미니 스크린에 엔젤디 전용 애니메이션 수록.",
    },
    "merch-2026aw-apparel": {
      name: "삼Z STUDIO 2026AW 스트릿 어패럴 & HB2U 생일 굿즈 세트",
      series: "삼Z STUDIO 2026 FW 기획",
      characterOrFaction: "삼Z STUDIO · 2026AW",
      summary: "가을/겨울 아우터·후드·가방 및 에이전트 생일 기념 HB2U 굿즈 신상.",
      detailIntro: "일상 착용에 어울리는 뉴에리두 스트릿 어패럴 및 캐릭터 소품 라인업.",
    },
    "merch-delusion-earbuds": {
      name: "「엔젤디 · 샤이닝 데뷰」 이어클립 무선 이어폰 & 어패럴 시리즈",
      series: "엔젤디 오디오 & 어패럴",
      characterOrFaction: "엔젤디",
      summary: "「엔젤디」 전용 보이스가 내장된 이어클립형 블루투스 이어폰 및 테마 의류.",
      detailIntro: "가벼운 오픈형 착용감과 엔젤디 전용 안내 음성 탑재.",
    },
    "merch-bangboo-fruit-blindbox": {
      name: "「Bangboo 과일채소 왕국」 비닐 플러시 키링 블라인드 박스",
      series: "Bangboo 정기 신상 블라인드",
      characterOrFaction: "인기 Bangboo · 블라인드",
      summary: "과일 코스튬을 입은 인기 Bangboo 플러시 키링 & 미니 피규어 블라인드 박스.",
      detailIntro: "일반 6종 + 시크릿 1종 구성의 상시 인기 수집 굿즈.",
    },
    "merch-astra-miyabi-figures": {
      name: "스타즈 오브 리라 「아스트라 야오」 1/7 & LIMEPIE 「호시미 미야비」 1/8 새벽 Ver. 피규어",
      series: "인기 S급 에이전트 피규어",
      characterOrFaction: "아스트라 야오 · 호시미 미야비",
      summary: "뉴에리두의 디바 「아스트라 야오」(1/7)와 대공동 6과 과장 「호시미 미야비」(1/8) 공식 피규어.",
      detailIntro: "인기 최상위 S급 에이전트 2인의 고퀄리티 공식 피규어 상세 이미지 수록.",
    },
    "merch-rapid-power-pro": {
      name: "「급속 전력 Pro 시리즈」 140W GaN 고속 충전기 / 모듈형 보조배터리 / 240W 케이블",
      series: "공식 디지털 고속 충전 굿즈",
      characterOrFaction: "급속 전력 Pro · 디지털",
      summary: "140W 3포트 GaN 충전기와 조립식 보조배터리 등 뉴에리두 테마 디지털 주변기기.",
      detailIntro: "노트북·스마트폰 동시 고속 충전을 지원하는 실용 공식 테크 굿즈.",
    },
    "merch-v34-bundle": {
      name: "3.4 「긴 나날의 끝자락」 태양을 가져온 자 & 로빈 버전 신상 아크릴 스탠드/배지 예고",
      series: "3.4 버전 연동 신상 예고",
      characterOrFaction: "태양을 가져온 자 / 로빈 / 폼폼",
      summary: "3.4 업데이트에 맞춰 공개 예정인 「태양을 가져온 자」, 「로빈」, Bangboo 「폼폼」 공식 굿즈.",
      detailIntro: "12월 2일 3.4 버전 출시와 함께 공식 스토어 순차 공개 예정.",
    },
  },

  en: {
    "merch-hz-fes-2026": {
      name: "Hangzhou 2026 FES & Zenless LIVE On-Site Exclusive Merch Lineup",
      series: "2026 Hangzhou FES Debut",
      characterOrFaction: "All Factions · 2026 FES",
      summary: "Official FES & Zenless LIVE venue-exclusive stands, badges, lightsticks, and bonus gifts.",
      detailIntro: "Debuting Nov 27–29 at Hangzhou Grand Convention Center official merch halls.",
    },
    "merch-tidal-noise-kb": {
      name: 'ZZZ Studio "Tidal Noise" Tri-Mode Custom Mechanical Keyboard Set',
      series: "ZZZ Studio Flagship Tech Drop",
      characterOrFaction: "ZZZ Studio · Peripherals",
      summary: "New Eridu street-style tri-mode mechanical keyboard with custom switches & Bangboo keycaps.",
      detailIntro: "Supports wired, 2.4GHz, and Bluetooth modes with themed keycap bundle.",
    },
    "merch-yadea-ebikes": {
      name: "Yadea × Zenless Zone Zero Custom E-Bikes (Ellen Joe / Von Lycaon / Bangboo)",
      series: "Yadea Official Brand Collab",
      characterOrFaction: "Victoria Housekeeping Co. · Bangboo",
      summary: "4 official collab electric bikes featuring Ellen Joe, Von Lycaon & Bangboo liveries plus Fairy dashboard UI.",
      detailIntro: "Unveiled at the Wuhan Happy Valley 717 Festival; available at authorized Yadea stores.",
    },
    "merch-yuzuha-figure": {
      name: 'Faction Series — Spook Shack "Ukinami Yuzuha" 1/7 Scale Figure',
      series: "Faction Series 1/7 Collectible Figure",
      characterOrFaction: "Ukinami Yuzuha · Spook Shack",
      summary: "1/7 scale painted figure of Spook Shack Agent Ukinami Yuzuha with signature umbrella and sculpted details.",
      detailIntro: "Officially supervised 1/7 scale figure with official pre-order bonus.",
    },
    "merch-yixuan-figure": {
      name: 'LIMEPIE Series — Yunkui Summit "Yixuan" 1/8 Scale Figure (Ink Shadow Ver.)',
      series: "LIMEPIE 1/8 Scale Figure Line",
      characterOrFaction: "Yixuan · Yunkui Summit",
      summary: "Yunkui Summit master Yixuan in LIMEPIE 1/8 scale with sculpted ink-wash visual effects.",
      detailIntro: "Accessible collector pricing paired with dynamic ink-inspired detailing.",
    },
    "merch-delusion-controller": {
      name: '"Angels of Delusion" Flydigi Apex 6 Pro Haptic Controller Gift Box',
      series: "ZZZ Studio × Flydigi Collab",
      characterOrFaction: "Angels of Delusion",
      summary: "Flagship wireless haptic controller in Angels of Delusion theme with exclusive gift box.",
      detailIntro: "Force-feedback triggers and mini-screen featuring exclusive Angels of Delusion animations.",
    },
    "merch-2026aw-apparel": {
      name: "ZZZ Studio 2026AW Streetwear & HB2U Birthday Merch Collection",
      series: "ZZZ Studio 2026 Autumn/Winter",
      characterOrFaction: "ZZZ Studio · 2026AW",
      summary: "Autumn/Winter jackets, hoodies, bags, and Agent HB2U birthday commemorative bundles.",
      detailIntro: "Wearable New Eridu street fashion paired with seasonal character accessories.",
    },
    "merch-delusion-earbuds": {
      name: '"Angels of Delusion" Clip-On Bluetooth Earbuds Gift Box & Apparel Series',
      series: "Angels of Delusion Audio & Fashion",
      characterOrFaction: "Angels of Delusion",
      summary: "Open-ear clip-on wireless earbuds with custom Angels of Delusion voice prompts & matching apparel.",
      detailIntro: "Lightweight open-ear comfort featuring exclusive character voice alerts.",
    },
    "merch-bangboo-fruit-blindbox": {
      name: '"Bangboo Fruit & Veggie Kingdom" Vinyl Plush Keychain Blind Box',
      series: "Regular Bangboo Collectible Drop",
      characterOrFaction: "Bangboo · Blind Box",
      summary: "Adorable fruit-themed Bangboo plush keychains and mini figures in blind box format.",
      detailIntro: "6 regular designs + 1 secret rare design, ideal as everyday bag charms.",
    },
    "merch-astra-miyabi-figures": {
      name: 'Stars of Lyra "Astra Yao" 1/7 & LIMEPIE "Hoshimi Miyabi" 1/8 Dawn Ver. Figures',
      series: "Flagship S-Rank Agent Figures",
      characterOrFaction: "Astra Yao · Hoshimi Miyabi",
      summary: "Collector figures of New Eridu diva Astra Yao (1/7) and Section 6 Chief Hoshimi Miyabi (1/8).",
      detailIntro: "Inspect multi-image official photos of two fan-favorite S-Rank Agents.",
    },
    "merch-rapid-power-pro": {
      name: '"Rapid Power Pro" 140W GaN Charger / Modular Power Bank / 240W Cable',
      series: "Official Fast-Charging Tech Gear",
      characterOrFaction: "Rapid Power Pro · Tech",
      summary: "140W 3-port GaN charger, modular power bank, and braided 240W cable in New Eridu styling.",
      detailIntro: "High-wattage official tech accessories built for laptops, phones, and handhelds.",
    },
    "merch-v34-bundle": {
      name: 'Ver. 3.4 "The Finality of the Day" Sunbringer & Robin Acrylic Stands / Badges Preview',
      series: "Ver. 3.4 Launch Merch Preview",
      characterOrFaction: "Sunbringer / Robin / Pom-Pom",
      summary: "Upcoming Version 3.4 character merch lineup for Sunbringer, Robin, and Bangboo Pom-Pom.",
      detailIntro: "Scheduled to roll out alongside the December 2 Version 3.4 release.",
    },
  },
};

const CODE_I18N: Record<Exclude<AppLang, "zh">, Record<string, Partial<RedeemCode>>> = {
  ja: {
    ZENLESSGIFT: {
      rewards: "ポリクローム ×50 · 正式調査員の記録 ×2 · 音動機用エネルギーモジュール ×3 · ボンプ用アルゴリズムモジュール ×1",
      note: "常設ウェルカムコード（未受け取りの全プロキシ対象）。",
    },
    ZZZ34FINALITY: {
      rewards: "ポリクローム ×60 · ディニー ×6,666",
      note: "Ver.3.4「ついには長き、日の終わり」記念コード。",
    },
    NEWWORLD34: {
      rewards: "ポリクローム ×50 · ベテラン調査員の記録 ×3",
      note: "シーズン3振り返り「新世界前夜」海外コミュニティ記念コード（Ver.3.4配信当日まで）。",
    },
    SUNBRINGER34: {
      rewards: "ポリクローム ×300 · ベテラン調査員の記録 ×2 · 音動機用エネルギーモジュール ×3 · ディニー ×30,000",
      note: "Ver.3.4 予告番組 300 ポリクローム限定コード（11/22 23:59 終了・アーカイブ）。",
    },
  },
  ko: {
    ZENLESSGIFT: {
      rewards: "폴리크롬 ×50 · 정규 조사원 기록 ×2 · W-엔진 전원 ×3 · Bangboo 알고리즘 모듈 ×1",
      note: "상시 웰컴 리딤코드 (미수령 로프꾼 전원 사용 가능).",
    },
    ZZZ34FINALITY: {
      rewards: "폴리크롬 ×60 · 데니 ×6,666",
      note: "3.4 「긴 나날의 끝자락」 기념 리딤코드.",
    },
    NEWWORLD34: {
      rewards: "폴리크롬 ×50 · 선임 조사원 기록 ×3",
      note: "시즌 3 회고 「새로운 세계의 전야」 글로벌 커뮤니티 코드 (3.4 출시일 마감).",
    },
    SUNBRINGER34: {
      rewards: "폴리크롬 ×300 · 선임 조사원 기록 ×2 · W-엔진 에너지 모듈 ×3 · 데니 ×30,000",
      note: "3.4 특별 방송 300 폴리크롬 한정 코드 (11/22 23:59 만료·기록 보관).",
    },
  },
  en: {
    ZENLESSGIFT: {
      rewards: "Polychrome ×50 · Official Investigator Log ×2 · W-Engine Power Supply ×3 · Bangboo Algorithm Module ×1",
      note: "Permanent welcome code redeemable once per Proxy account.",
    },
    ZZZ34FINALITY: {
      rewards: "Polychrome ×60 · Denny ×6,666",
      note: 'Version 3.4 "The Finality of the Day" commemorative code.',
    },
    NEWWORLD34: {
      rewards: "Polychrome ×50 · Senior Investigator Log ×3",
      note: 'Season 3 "The Eve of a New World" global community code (expires on Ver. 3.4 launch).',
    },
    SUNBRINGER34: {
      rewards: "Polychrome ×300 · Senior Investigator Log ×2 · W-Engine Energy Module ×3 · Denny ×30,000",
      note: "Version 3.4 Special Program 300 Polychrome code (expired Nov 22 23:59 UTC+8).",
    },
  },
};

const CODE_REGION_I18N: Record<AppLang, Record<string, string>> = {
  zh: {
    "国服 / 国际服通用": "国服 / 国际服通用",
    "国际服 / 亚服": "国际服 / 亚服",
    国服米游社: "国服米游社",
  },
  ja: {
    "国服 / 国际服通用": "全サーバー共通",
    "国际服 / 亚服": "日本 / グローバル",
    国服米游社: "中国サーバー",
  },
  ko: {
    "国服 / 国际服通用": "전 서버 공용",
    "国际服 / 亚服": "글로벌 / 아시아",
    国服米游社: "중국 서버",
  },
  en: {
    "国服 / 国际服通用": "Global & CN",
    "国际服 / 亚服": "Global / Asia",
    国服米游社: "CN Only",
  },
};

type MerchExtraPatch = Partial<
  Pick<MerchItem, "priceText" | "releaseDate" | "shipDate" | "channels" | "specs">
>;

const MERCH_EXTRA_I18N: Record<Exclude<AppLang, "zh">, Record<string, MerchExtraPatch>> = {
  ja: {
    "merch-hz-fes-2026": {
      releaseDate: "2026-11-27 杭州大会展中心にて会場初頒布",
      shipDate: "会場物販にて即渡し・会期後に米遊舗で事後通販",
      channels: ["杭州大会展中心 FES 会場物販", "米遊舗 ゼンゼロ公式ショップ（事後通販）"],
      specs: [
        "2026 FES「布夢カーニバル」限定アクスタ・金属缶バッジ・ボンプ痛バッグ・レーザーチケット収録",
        "Zenless LIVE 2026 限定ペンライト・マフラータオル・記念Tシャツを同時展開",
        "会場購入金額に応じた段階特典あり、後日オンライン事後通販予定",
      ],
    },
    "merch-tidal-noise-kb": {
      priceText: "¥799（フルセット ¥949）",
      releaseDate: "2026-10-20 20:00 公式各ストア発売",
      shipDate: "在庫販売・注文順に順次発送",
      channels: ["Tmall 三Z公式ストア", "米遊社・米遊舗", "Douyin ゼンゼロ公式グッズ店"],
      specs: [
        "ノイズ軸（タクタイル）／変調軸（リニア）の2種スイッチ選択可能・3モード無線対応",
        "キーボード単体 ¥799 ｜ シリコンリストレスト＋大型デスクマット付フルセット ¥949",
        "単品別売：シリコンリストレスト ¥119 ｜ マウスパッド ¥68 ｜ 交換プレート ¥20",
      ],
    },
    "merch-yadea-ebikes": {
      releaseDate: "2026-07 発売開始・全国店舗＆オンライン販売中",
      shipDate: "オンライン購入後、中国全国の Yadea 正規店舗にて納車・登録",
      channels: ["Yadea Tmall / JD / Douyin 公式ストア", "中国全国 Yadea 正規販売店"],
      specs: [
        "冠能 B60S ボンプモデル：約 ¥4,199〜（丸みのある街乗りモデル）",
        "冠能 白鯊 II エレン・ジョーモデル：約 ¥5,399〜（サメ塗装＋Fairy カスタムUI）",
        "冠能 i7 フォン・ライカンモデル ｜ 冠能 星艦 II エレンフラッグシップ：約 ¥7,399",
        "購入特典：コラボヘルメット・アクスタ・ステッカー入りギフトボックス＆ゲーム内特典コード",
      ],
    },
    "merch-yuzuha-figure": {
      priceText: "¥949（予約金 ¥150）",
      releaseDate: "2026-10-20 20:00 公式予約受付開始",
      shipDate: "2027年9月 出荷予定",
      channels: ["Tmall 三Z公式ストア", "米遊社・米遊舗", "Douyin ゼンゼロ公式グッズ店"],
      specs: [
        "公式価格 ¥949（予約金 ¥150、出荷時残金 ¥799）",
        "公式予約特典：陣営シリーズ 怪啖屋「浮波柚葉」1/7 特典アクリルキーホルダー",
        "怪啖屋「浮波柚葉」の特徴的な衣装ディテールとタヌキ相棒の台座を精巧に再現",
      ],
    },
    "merch-yixuan-figure": {
      priceText: "¥299（予約金 ¥40）",
      releaseDate: "2026-10-20 20:00 公式予約受付開始",
      shipDate: "2027年7月 出荷予定",
      channels: ["Tmall 三Z公式ストア", "米遊社・米遊舗", "Douyin ゼンゼロ公式グッズ店"],
      specs: [
        "LIMEPIE ライン：¥299（予約金 ¥40＋残金 ¥259）のハイコスパ設計",
        "雲嶽山「儀玄」の水墨風モチーフと衣装の躍動感を 1/8 スケールで立体化",
        "Tmall / 米遊舗 / Douyin 公式ストアにて予約受付中",
      ],
    },
    "merch-delusion-controller": {
      releaseDate: "2026-09-16 19:30 公式発売",
      shipDate: "在庫販売中（公式ストアより発送）",
      channels: ["Tmall 三Z公式ストア", "米遊社・米遊舗", "Douyin ゼンゼロ公式グッズ店"],
      specs: [
        "フォース調整合金スティック＆フォースフィードバックトリガー搭載で連携スキル・パリィ操作に最適化",
        "カスタム塗装コントローラー・充電ドック・専用ケース・「妄想エンジェル」記念カード同梱",
        "内蔵ディスプレイにゼンゼロ専用アニメーション＆触覚フィードバックチューニングを収録",
      ],
    },
    "merch-2026aw-apparel": {
      releaseDate: "2026-09-03 20:00 発売・販売中",
      shipDate: "公式倉庫より通常発送",
      channels: ["Tmall 三Z公式ストア", "米遊社・米遊舗", "Douyin ゼンゼロ公式グッズ店"],
      specs: [
        "三Z STUDIO 2026AW 主力：スタンドカラージャケット・速乾プルオーバー・ワイドパンツ",
        "「協奏バンド」シリーズ各種グッズ＆「HB2U」バースデー記念セット第8・9弾を同時展開",
        "普段使いしやすい落ち着いたストリートデザインで秋冬コーデに対応",
      ],
    },
    "merch-delusion-earbuds": {
      releaseDate: "2026-06 / 07 順次発売・再販在庫あり",
      shipDate: "在庫あり・順次発送",
      channels: ["Tmall 三Z公式ストア", "米遊社・米遊舗", "Douyin ゼンゼロ公式グッズ店"],
      specs: [
        "「妄想エンジェル・キラキラ登場」イヤーカフ型ワイヤレスイヤホンセット（専用ガイド音声＋保護ケース）",
        "「妄想エンジェル・ドリーマーへ」応援コレクターズボックス＆「インターノット選」フォトセット",
        "「妄想エンジェル」テーマアパレル・ぬいぐるみキーホルダー・缶バッジ＆カードセット",
      ],
    },
    "merch-bangboo-fruit-blindbox": {
      priceText: "¥49 ~ ¥79 / BOX",
      releaseDate: "2026-07 初登場・11月在庫補充済み",
      shipDate: "在庫品・48時間以内発送",
      channels: ["米遊社・米遊舗", "Tmall 三Z公式ストア", "Douyin ゼンゼロ公式グッズ店"],
      specs: [
        "「ボンプ・フルーツ王国」ソフビ顔＋ふわふわぬいぐるみキーホルダー（バッグチャーム対応）",
        "「百味王国」ボンプミニフィギュア＆「TinyAgents」デフォルメブラインドボックスも同時販売",
        "単品ランダム購入・コンプリートBOX（重複なし・シークレット封入チャンスあり）対応",
      ],
    },
    "merch-astra-miyabi-figures": {
      releaseDate: "アストラ・ヤオ 2026年11月残金決済 ｜ 星見雅 予約受付中",
      shipDate: "アストラ・ヤオ 11月より順次発送開始",
      channels: ["Tmall 三Z公式ストア", "米遊社・米遊舗", "Douyin ゼンゼロ公式グッズ店"],
      specs: [
        "スターズ・オブ・リラ「アストラ・ヤオ」1/7 スケール：¥949（予約金 ¥150＋残金 ¥799・特典付）",
        "LIMEPIE「星見雅」1/8 スケール 暁Ver.：対ホロウ6課課長・虚狩りの凛とした立ち姿を立体化",
        "注意：アストラ・ヤオ予約済みの方は11月の残金決済通知をご確認ください",
      ],
    },
    "merch-rapid-power-pro": {
      releaseDate: "2026年 公式ストア定番在庫販売中",
      shipDate: "在庫品・スピード発送",
      channels: ["Tmall 三Z公式ストア", "米遊社・米遊舗", "Douyin ゼンゼロ公式グッズ店"],
      specs: [
        "140W GaN 3ポート急速充電器：ノートPC・スマホ・携帯ゲーム機を同時急速充電",
        "モジュラー組立式モバイルバッテリー：新エリー都インダストリアルデザイン",
        "240W 編組急速充電ケーブル：高耐久ナイロン編組＋カスタムコネクタ",
      ],
    },
    "merch-v34-bundle": {
      priceText: "¥35 ~ ¥128（予想）",
      releaseDate: "2026-12-02 Ver.3.4 リリース連動発表予定",
      shipDate: "12月2日 米遊舗にて詳細公開予定",
      channels: ["米遊社・米遊舗", "Tmall 三Z公式ストア", "Douyin ゼンゼロ公式グッズ店"],
      specs: [
        "バージョン更新恒例の新エージェント立ち絵アクスタ・缶バッジ・心象映画色紙を展開予定",
        "注目：初の結使・虚狩り「サンブリンガー」＆コラボ「ロビン／ボンプ パム」限定グッズ",
        "Zzone バックエンドが30分ごとに中国公式「新品情報」を監視し、画像公開と同時に自動更新",
      ],
    },
  },
  ko: {
    "merch-hz-fes-2026": {
      releaseDate: "2026-11-27 항저우 국제엑스포센터 현장 최초 판매",
      shipDate: "현장 수령 · 행사 종료 후 공식 스토어 사후 통판 예정",
      channels: ["항저우 FES 현장 굿즈존", "미유푸 공식샵 (사후 통판)"],
      specs: [
        "2026 FES 「꿈의 카니발」 한정 아크릴 스탠드 · 메탈 배지 · Bangboo 이타백 · 레이저 티켓",
        "Zenless LIVE 2026 콘서트 한정 응원봉 · 슬로건 타월 · 기념 티셔츠 동시 출시",
        "현장 구매 금액별 단계 특전 증정 및 행사 후 온라인 사후 통판 예정",
      ],
    },
    "merch-tidal-noise-kb": {
      priceText: "¥799 (풀세트 ¥949)",
      releaseDate: "2026-10-20 20:00 공식 채널 판매 시작",
      shipDate: "재고 판매 · 주문 순차 발송",
      channels: ["Tmall 삼Z 공식샵", "미유사 · 미유푸", "도우인 공식 굿즈샵"],
      specs: [
        "노이즈 축(택타일) / 변조 축(리니어) 2종 스위치 선택 및 3모드 무선 연결 지원",
        "키보드 단품 ¥799 ｜ 실리콘 팜레스트 + 대형 데스크매트 풀세트 ¥949",
        "개별 액세서리: 팜레스트 ¥119 ｜ 마우스패드 ¥68 ｜ 커스텀 플레이트 ¥20",
      ],
    },
    "merch-yadea-ebikes": {
      releaseDate: "2026-07 출시 · 중국 전국 매장 및 온라인 판매 중",
      shipDate: "온라인 결제 후 중국 전국 Yadea 지정 매장 출고",
      channels: ["Yadea Tmall / JD / 도우인 공식샵", "중국 전국 Yadea 공식 대리점"],
      specs: [
        "B60S Bangboo 에디션: 약 ¥4,199~ (일상 통근용 컴팩트 모델)",
        "백상아리 II 엘렌 조 에디션: 약 ¥5,399~ (상어 데칼 + Fairy 커스텀 계기판 UI)",
        "i7 본・리카온 에디션 ｜ 성함 II 엘렌 플래그십 에디션: 약 ¥7,399",
        "구매 시 콜라보 헬멧 · 아크릴 스탠드 · 스티커 기프트박스 및 인게임 쿠폰 증정",
      ],
    },
    "merch-yuzuha-figure": {
      priceText: "¥949 (예약금 ¥150)",
      releaseDate: "2026-10-20 20:00 공식 예약 개시",
      shipDate: "2027년 9월 출하 예정",
      channels: ["Tmall 삼Z 공식샵", "미유사 · 미유푸", "도우인 공식 굿즈샵"],
      specs: [
        "공식 정가 ¥949 (예약금 ¥150 + 출하 시 잔금 ¥799)",
        "공식 예약 특전: 진영 시리즈 괴담방 「우키나미 유즈하」 1/7 특전 아크릴 키링",
        "괴담방 「우키나미 유즈하」의 시그니처 의상과 너구리 파트너 베이스 정밀 구현",
      ],
    },
    "merch-yixuan-figure": {
      priceText: "¥299 (예약금 ¥40)",
      releaseDate: "2026-10-20 20:00 공식 예약 개시",
      shipDate: "2027년 7월 출하 예정",
      channels: ["Tmall 삼Z 공식샵", "미유사 · 미유푸", "도우인 공식 굿즈샵"],
      specs: [
        "LIMEPIE 합리적 가격대: 정가 ¥299 (예약금 ¥40 + 잔금 ¥259)",
        "운규산 사부 「의현」의 수묵화 분위기 조형과 디테일을 1/8 스케일로 완성",
        "Tmall / 미유푸 / 도우인 공식 스토어 동시 예약 진행",
      ],
    },
    "merch-delusion-controller": {
      releaseDate: "2026-09-16 19:30 공식 출시",
      shipDate: "재고 판매 중",
      channels: ["Tmall 삼Z 공식샵", "미유사 · 미유푸", "도우인 공식 굿즈샵"],
      specs: [
        "장력 조절 합금 스틱 + 포스 피드백 트리거로 젠존제 콤보 스킬·패링 손맛 최적화",
        "커스텀 컨트롤러 · 전용 충전 독 · 휴대용 파우치 · 「엔젤디」 한정 기념 카드 구성",
        "내장 미니 스크린 전용 애니메이션 및 햅틱 진동 튜닝 탑재",
      ],
    },
    "merch-2026aw-apparel": {
      releaseDate: "2026-09-03 20:00 출시 · 판매 중",
      shipDate: "공식 물류창고 순차 발송",
      channels: ["Tmall 삼Z 공식샵", "미유사 · 미유푸", "도우인 공식 굿즈샵"],
      specs: [
        "삼Z STUDIO 2026AW 주력: 스탠드칼라 재킷 · 속건 풀오버 · 와이드 스트레이트 팬츠",
        "협주 밴드 굿즈 및 「HB2U」 에이전트 생일 기념 세트 8·9탄 동시 출시",
        "일상 코디에 자연스럽게 녹아드는 어반 스트리트 웨어 라인업",
      ],
    },
    "merch-delusion-earbuds": {
      releaseDate: "2026-06 / 07 출시 · 재입고 판매 중",
      shipDate: "재고 즉시 발송",
      channels: ["Tmall 삼Z 공식샵", "미유사 · 미유푸", "도우인 공식 굿즈샵"],
      specs: [
        "「엔젤디 · 반짝 등장」 이어클립 블루투스 이어폰 세트 (전용 안내 음성 + 보호 케이스)",
        "「엔젤디 · 드리머에게」 응원 컬렉터즈 박스 & 「로프넷 셀렉션」 포토 세트",
        "「엔젤디」 테마 어패럴 · 봉제 키링 · 배지 및 포토카드 세트",
      ],
    },
    "merch-bangboo-fruit-blindbox": {
      priceText: "¥49 ~ ¥79 / 박스",
      releaseDate: "2026-07 첫 출시 · 11월 재입고",
      shipDate: "재고 상품 · 48시간 이내 발송",
      channels: ["미유사 · 미유푸", "Tmall 삼Z 공식샵", "도우인 공식 굿즈샵"],
      specs: [
        "「Bangboo 과일 왕국」 비닐 페이스 + 봉제 키링 블라인드 박스",
        "「백미 왕국」 Bangboo 미니 피규어 & 「TinyAgents」 SD 피규어 동시 판매",
        "단품 랜덤 구매 및 풀박스(중복 없음 · 시크릿 확률 포함) 선택 가능",
      ],
    },
    "merch-astra-miyabi-figures": {
      releaseDate: "아스트라 야오 2026년 11월 잔금 결제 ｜ 호시미 미야비 예약 중",
      shipDate: "아스트라 야오 11월부터 순차 발송",
      channels: ["Tmall 삼Z 공식샵", "미유사 · 미유푸", "도우인 공식 굿즈샵"],
      specs: [
        "스타즈 오브 리라 「아스트라 야오」 1/7 피규어: 정가 ¥949 (예약금 ¥150 + 잔금 ¥799 · 특전 포함)",
        "LIMEPIE 대공동 6과 과장 「호시미 미야비」 1/8 피규어 새벽 Ver.",
        "안내: 아스트라 야오 예약 구매자는 11월 잔금 결제 안내를 확인해 주세요",
      ],
    },
    "merch-rapid-power-pro": {
      releaseDate: "2026년 공식 스토어 상시 판매",
      shipDate: "재고 즉시 발송",
      channels: ["Tmall 삼Z 공식샵", "미유사 · 미유푸", "도우인 공식 굿즈샵"],
      specs: [
        "140W GaN 3포트 고속 충전기: 노트북·스마트폰·휴대용 게임기 동시 고속 충전",
        "모듈러 조립식 보조배터리: 뉴에리두 인더스트리얼 디자인",
        "240W 고속 충전 브레이드 케이블: 내구성 강화 직조 케이블 + 커스텀 단자",
      ],
    },
    "merch-v34-bundle": {
      priceText: "¥35 ~ ¥128 (예상)",
      releaseDate: "2026-12-02 3.4 버전 업데이트 동시 공개 예정",
      shipDate: "12월 2일 공식 스토어 상세 공개",
      channels: ["미유사 · 미유푸", "Tmall 삼Z 공식샵", "도우인 공식 굿즈샵"],
      specs: [
        "대규모 버전 업데이트마다 출시되는 신규 에이전트 일러스트 아크릴 · 배지 · 형상 시네마 색지 예고",
        "핵심 라인업: 최초 결사 공허 사냥꾼 「태양을 가져온 자」 & 콜라보 「로빈 / Bangboo 폼폼」",
        "Zzone 서버가 30분마다 신상 공지를 자동 점검하여 공식 이미지 공개 시 즉시 반영",
      ],
    },
  },
  en: {
    "merch-hz-fes-2026": {
      releaseDate: "2026-11-27 Debut at Hangzhou Grand Convention Center",
      shipDate: "On-site venue pickup · Post-event online restock on miHoYoGift",
      channels: ["Hangzhou FES On-Site Merch Zone", "miHoYoGift ZZZ Store (Post-Event)"],
      specs: [
        "Includes 2026 FES themed acrylic stands, metal badges, Bangboo ita-bag & holographic tickets",
        "Launches alongside Zenless LIVE 2026 concert lightsticks, towels, and commemorative tees",
        "Tiered on-site purchase bonuses plus post-event online orders for Proxies unable to attend",
      ],
    },
    "merch-tidal-noise-kb": {
      priceText: "¥799 (Full Bundle ¥949)",
      releaseDate: "2026-10-20 20:00 Official Store Launch",
      shipDate: "In stock · Ships in order sequence",
      channels: ["Tmall ZZZ Official Store", "Miyoushe · miHoYoGift", "Douyin Official Merch Shop"],
      specs: [
        "Choice of tactile Noise Switches or linear Signal Switches with tri-mode wireless (2.4G / BT / USB-C)",
        "Keyboard only ¥799 | Full bundle with silicone wrist rest + XL desk mat ¥949",
        "Individual add-ons: Wrist rest ¥119 | Desk mat ¥68 | Custom accent plate set ¥20",
      ],
    },
    "merch-yadea-ebikes": {
      releaseDate: "Launched Jul 2026 · Available nationwide & online in China",
      shipDate: "Online voucher redemption & pickup at authorized Yadea stores",
      channels: ["Yadea Tmall / JD / Douyin Official", "Authorized Yadea Offline Stores (CN)"],
      specs: [
        "B60S Bangboo Edition: ~¥4,199+ (compact daily commuter styling)",
        "White Shark II Ellen Joe Edition: ~¥5,399+ (shark livery + custom Fairy dashboard UI)",
        "i7 Von Lycaon Edition | Starship II Ellen Flagship Edition: ~¥7,399",
        "Includes themed gift box (custom helmet, acrylic stand, decals) and in-game CDK reward",
      ],
    },
    "merch-yuzuha-figure": {
      priceText: "¥949 (Deposit ¥150)",
      releaseDate: "2026-10-20 20:00 Pre-Order Open",
      shipDate: "Est. Ship Sep 2027",
      channels: ["Tmall ZZZ Official Store", "Miyoushe · miHoYoGift", "Douyin Official Merch Shop"],
      specs: [
        "Full price ¥949 (¥150 pre-order deposit + ¥799 balance upon release)",
        "Official pre-order bonus: Spook Shack Ukinami Yuzuha 1/7 exclusive acrylic charm",
        "Faithfully sculpts Ukinami Yuzuha's signature outfit and dynamic tanuki companion diorama base",
      ],
    },
    "merch-yixuan-figure": {
      priceText: "¥299 (Deposit ¥40)",
      releaseDate: "2026-10-20 20:00 Pre-Order Open",
      shipDate: "Est. Ship Jul 2027",
      channels: ["Tmall ZZZ Official Store", "Miyoushe · miHoYoGift", "Douyin Official Merch Shop"],
      specs: [
        "Value-focused LIMEPIE line: ¥299 full price (¥40 deposit + ¥259 balance)",
        "1/8 scale painted figure capturing Yunkui Summit Grandmaster Yixuan's ink-wash aesthetic",
        "Available for pre-order across Tmall, miHoYoGift, and Douyin official stores",
      ],
    },
    "merch-delusion-controller": {
      releaseDate: "2026-09-16 19:30 Official Launch",
      shipDate: "In stock · Official flagship shipping",
      channels: ["Tmall ZZZ Official Store", "Miyoushe · miHoYoGift", "Douyin Official Merch Shop"],
      specs: [
        "Force-adjustable alloy thumbsticks & adaptive triggers tuned for ZZZ Chain Attacks and Perfect Assists",
        "Includes custom-painted controller, charging dock, travel case & Angels of Delusion collector card",
        "Built-in mini display with ZZZ idle animations and custom haptic tuning",
      ],
    },
    "merch-2026aw-apparel": {
      releaseDate: "2026-09-03 20:00 Released · In Stock",
      shipDate: "Ships from official warehouse",
      channels: ["Tmall ZZZ Official Store", "Miyoushe · miHoYoGift", "Douyin Official Merch Shop"],
      specs: [
        "ZZZ Studio 2026AW highlights: stand-collar tech jacket, quick-dry pullover, and wide straight trousers",
        "Released alongside Concert Band merch and HB2U Agent Birthday Sets Waves 8 & 9",
        "Subtle everyday streetwear silhouettes designed for autumn/winter layering",
      ],
    },
    "merch-delusion-earbuds": {
      releaseDate: "Jun–Jul 2026 Waves · Restocked",
      shipDate: "In stock · Standard shipping",
      channels: ["Tmall ZZZ Official Store", "Miyoushe · miHoYoGift", "Douyin Official Merch Shop"],
      specs: [
        "Angels of Delusion open-ear clip Bluetooth earbuds gift set with custom voice prompts & case",
        "Includes Angels of Delusion collector cheer box & Inter-Knot photo collection set",
        "Accompanied by themed apparel, plush charms, and badge/photocard packs",
      ],
    },
    "merch-bangboo-fruit-blindbox": {
      priceText: "¥49 ~ ¥79 / Box",
      releaseDate: "Jul 2026 Debut · Nov Restock",
      shipDate: "In stock · Ships within 48h",
      channels: ["Miyoushe · miHoYoGift", "Tmall ZZZ Official Store", "Douyin Official Merch Shop"],
      specs: [
        "Bangboo Fruit Kingdom vinyl-face plush keychain blind boxes ideal for bags and keys",
        "Also features Hundred Flavors Bangboo mini figures & TinyAgents chibi blind boxes",
        "Available as single blind boxes or full display cases (no duplicates + secret rare chance)",
      ],
    },
    "merch-astra-miyabi-figures": {
      releaseDate: "Astra Yao Nov 2026 Final Payment | Hoshimi Miyabi Pre-Order",
      shipDate: "Astra Yao shipping in waves from Nov 2026",
      channels: ["Tmall ZZZ Official Store", "Miyoushe · miHoYoGift", "Douyin Official Merch Shop"],
      specs: [
        "Stars of Lyra Astra Yao 1/7 Scale: ¥949 (¥150 deposit + ¥799 balance, includes bonus charm)",
        "LIMEPIE Hoshimi Miyabi 1/8 Scale Dawn Ver.: Section 6 Chief Void Hunter sculpt at accessible pricing",
        "Reminder: Proxies who placed Astra Yao deposits should watch for November balance notices",
      ],
    },
    "merch-rapid-power-pro": {
      releaseDate: "2026 Official Flagship Regular Lineup",
      shipDate: "In stock · Express dispatch",
      channels: ["Tmall ZZZ Official Store", "Miyoushe · miHoYoGift", "Douyin Official Merch Shop"],
      specs: [
        "140W 3-port GaN charger supporting laptops, phones, and handheld gaming PCs simultaneously",
        "Modular snap-on power bank styled after New Eridu industrial hardware",
        "240W braided fast-charging cable with custom molded connectors",
      ],
    },
    "merch-v34-bundle": {
      priceText: "¥35 ~ ¥128 (Est.)",
      releaseDate: "2026-12-02 Launches with Version 3.4",
      shipDate: "Full details on Dec 2 via miHoYoGift",
      channels: ["Miyoushe · miHoYoGift", "Tmall ZZZ Official Store", "Douyin Official Merch Shop"],
      specs: [
        "Follows regular major-version launch cadence with character splash stands, badges & Mindscape shikishi",
        "Highlights: First Enchainer Void Hunter Sunbringer & crossover Robin / Bangboo Pom-Pom merch",
        "Zzone monitors official merch announcements every 30 min and updates galleries automatically",
      ],
    },
  },
};

export function localizeEvent(ev: OfflineEvent, lang: AppLang): OfflineEvent {
  if (lang === "zh") return ev;
  const patch = EVENT_I18N[lang]?.[ev.id] || ARCHIVE_EVENT_I18N[lang]?.[ev.id];
  return patch ? { ...ev, ...patch } : ev;
}

export function localizeMerch(item: MerchItem, lang: AppLang): MerchItem {
  if (lang === "zh") return item;
  const patch = MERCH_I18N[lang]?.[item.id] || ARCHIVE_MERCH_I18N[lang]?.[item.id];
  const extra = MERCH_EXTRA_I18N[lang]?.[item.id];
  return { ...item, ...(patch || {}), ...(extra || {}) };
}

export function localizeCode(code: RedeemCode, lang: AppLang): RedeemCode & { regionLabel: string } {
  const regionLabel = CODE_REGION_I18N[lang][code.region] || code.region;
  if (lang === "zh") return { ...code, regionLabel };
  const patch = CODE_I18N[lang]?.[code.code];
  return { ...code, ...(patch || {}), regionLabel };
}

export function localizeSource(src: CollectorSourceInfo, lang: AppLang): CollectorSourceInfo {
  if (lang === "zh") return src;
  const map: Record<Exclude<AppLang, "zh">, Record<string, { name: string; desc: string; handle?: string }>> = {
    ja: {
      "zzz-cn-official": { name: "ゼンレスゾーンゼロ 中国公式", handle: "api-takumi-static · Content-V2", desc: "中国公式サイトより杭州FES・ZLIVE・大型コラボ・新作グッズ情報を15分ごとに取得。" },
      "hoyoverse-global": { name: "HoYoverse 国際公式", handle: "sg-public-api-static · ja-jp / en-us", desc: "グローバル公式サイトから最新バージョン・イベント告知をリアルタイム同期。" },
      "miyoushe-official": { name: "米遊社 公式コミュニティ", handle: "bbs-api-static · gids=8 (直接取得)", desc: "中国公式コミュニティの限定イベントやグッズ特典投稿をマルチ画像付きで取得。" },
      "hoyolab-official": { name: "HoYoLAB 公式コミュニティ", handle: "bbs-api-os · gids=8 · ja-jp", desc: "HoYoLAB 日本語/多言語公式イベント・グッズ抽選・クリエイター企画を直接取得。" },
      "hoyoverse-jp": { name: "ゼンレスゾーンゼロ 日本公式 (ja-jp)", handle: "sg-public-api-static · ja-jp 差分監視", desc: "日本公式サイトから東京ライブ・秋葉原ポップアップ・日本限定コラボをリアルタイム取得。" },
      "youtube-official": { name: "公式 YouTube (@ZZZ_Official / @ZZZ_JP)", handle: "Native YouTube Atom RSS", desc: "公式 Atom RSS でキャラクターPV・EP・予告番組を自動取得。" },
      "hpoi-figures": { name: "Hpoi フィギュアデータベース", handle: "hpoi.net · 予約開始 / 締切 / 出荷", desc: "1/7スケールフィギュア・ねんどろいどの予約開始・締切・出荷時期を追跡。" },
      "weibo-official": { name: "Weibo @絶区零 & @米遊舗", handle: "Weibo Official Matrix", desc: "中国国内の大型ブランドコラボ・フィギュア実物写真・グッズ速報の最速発信元。" },
      "x-zzz-official": { name: "公式 X (@ZZZ_JP / @ZZZ_EN)", handle: "@ZZZ_JP · @ZZZ_EN · @ZZZ_CHT", desc: "日英公式Xの海外ポップアップ・ライブ・イラスト速報を監視。" },
      "bilibili-official": { name: "Bilibili 公式アカウント", handle: "UID 1636034895 · 公式チャンネル", desc: "公式動画・PV/EP初公開およびオフラインイベント告知を同期。" },
      "apex-gsc-makers": { name: "APEX-TOYS & Good Smile Company", handle: "1/7 フィギュア・ねんどろいど公式メーカー", desc: "公式パートナーフィギュアメーカーの原型公開・彩色見本・予約情報を追跡。" },
      "tmall-douyin-shops": { name: "Tmall 三Z公式店 & Douyin 公式ストア", handle: "米遊舗 · 三Z STUDIO · Douyin 公式", desc: "30分ごとに定期新作・予約締切・再販在庫をチェック。" },
      "cpp-allcpp": { name: "CPP 同人即売会データベース", handle: "allcpp.cn · ファンオンリー即売会", desc: "各地の非公式ファンオンリー即売会・オフ会スケジュールを収集。" },
      "ticket-show-damai": { name: "Bilibili 会員購 & 大麦チケット", handle: "show.bilibili.com · Damai", desc: "FES・ZLIVE・ポップアップのチケット発売・二次販売を監視。" },
      "xhs-taptap": { name: "RED (小紅書) & TapTap 公式", handle: "現地レポ・プラットフォーム限定コード", desc: "現地レポ・グッズ開封レビューおよびプラットフォーム限定交換コードを収集。" },
    },
    ko: {
      "zzz-cn-official": { name: "젠레스 존 제로 중국 공식", handle: "api-takumi-static · Content-V2", desc: "중국 공식 사이트에서 항저우 FES·ZLIVE·대형 콜라보 및 신상 굿즈 소식을 15분마다 수집." },
      "hoyoverse-global": { name: "HoYoverse 글로벌 / 한국 공식", handle: "sg-public-api-static · ko-kr", desc: "한국어 공식 사이트에서 최신 버전·이벤트 공지를 실시간 동기화." },
      "miyoushe-official": { name: "미유사 공식 커뮤니티", handle: "bbs-api-static · gids=8 (직접 수집)", desc: "중국 공식 커뮤니티의 굿즈 신상·이벤트 게시물을 원본 다중 이미지와 함께 수집." },
      "hoyolab-official": { name: "HoYoLAB 공식 커뮤니티", handle: "bbs-api-os · gids=8 · ko-kr", desc: "HoYoLAB 한국어/글로벌 공식 이벤트·실물 굿즈 추첨·크리에이터 행사 직접 수집." },
      "hoyoverse-jp": { name: "젠레스 존 제로 일본 공식 (ja-jp)", handle: "sg-public-api-static · ja-jp 차분 감지", desc: "도쿄 라이브·아키하바라 팝업 등 일본 지역 단독 오프라인 행사를 실시간 포착." },
      "youtube-official": { name: "공식 YouTube (@ZZZ_Official / @ZZZ_JP)", handle: "Native YouTube Atom RSS", desc: "공식 RSS를 통해 에이전트 PV·EP·특별 방송 영상을 자동 수집." },
      "hpoi-figures": { name: "Hpoi 피규어 데이터베이스", handle: "hpoi.net · 예약 개시 / 마감 / 출하", desc: "1/7 스케일 피규어·넨도로이드 예약 개시/마감/출시 일정 추적." },
      "weibo-official": { name: "웨이보 @절구령 & @미유푸", handle: "Weibo Official Matrix", desc: "중국 내 대형 콜라보 및 피규어 실물·굿즈 신상 최속 채널." },
      "x-zzz-official": { name: "공식 X (@ZZZ_EN / @ZZZ_JP)", handle: "@ZZZ_KO · @ZZZ_EN · @ZZZ_JP", desc: "글로벌·일본 공식 X의 해외 팝업 및 라이브 공지 모니터링." },
      "bilibili-official": { name: "Bilibili 공식 채널", handle: "UID 1636034895 · 공식 채널", desc: "공식 PV·EP 및 오프라인 행사 라이브 공지 동기화." },
      "apex-gsc-makers": { name: "APEX-TOYS & 굿스마일 컴퍼니", handle: "1/7 스케일 피규어 · 넨도로이드 제조사", desc: "공식 파트너 피규어 제조사의 원형·채색 샘플 및 예약 개시 정보 추적." },
      "tmall-douyin-shops": { name: "Tmall 삼Z 공식샵 & 도우인 스토어", handle: "미유푸 · 삼Z STUDIO · 도우인샵", desc: "30분마다 정기 신상·예약 마감·재입고 현황 점검." },
      "cpp-allcpp": { name: "CPP 동인 행사 포털", handle: "allcpp.cn · 팬 온리전 일정", desc: "각 지역 비공식 팬 온리전 및 동인 라이브 일정 수집." },
      "ticket-show-damai": { name: "Bilibili 티켓 & 다마이(Damai)", handle: "show.bilibili.com · Damai", desc: "FES·ZLIVE·팝업스토어 티켓 오픈 및 추가 판매 모니터링." },
      "xhs-taptap": { name: "샤오홍슈 & TapTap 공식", handle: "현장 후기 · 플랫폼 전용 코드", desc: "현장 후기·굿즈 실물 리뷰 및 플랫폼 전용 리딤코드 수집." },
    },
    en: {
      "zzz-cn-official": { name: "ZZZ China Official (zzz.mihoyo.com)", handle: "api-takumi-static · Content-V2", desc: "Direct CN official feed capturing Hangzhou FES, ZLIVE, major collabs & multi-image merch drops." },
      "hoyoverse-global": { name: "HoYoverse Global Official (en-us)", handle: "sg-public-api-static · en-us", desc: "Direct English official site feed synced every 15 minutes with automatic deduplication." },
      "miyoushe-official": { name: "Miyoushe Official Community", handle: "bbs-api-static · gids=8 (Direct API)", desc: "Direct official CN community feed capturing exclusive merch rewards and full multi-image galleries." },
      "hoyolab-official": { name: "HoYoLAB Official Community", handle: "bbs-api-os · gids=8 · en-us", desc: "Direct HoYoLAB feed capturing global giveaways, physical merch raffles, and creator events." },
      "hoyoverse-jp": { name: "ZZZ Japan Official (ja-jp)", handle: "sg-public-api-static · ja-jp diff feed", desc: "Tracks Japan-exclusive Tokyo concerts, Akihabara pop-ups, and regional brand collabs." },
      "youtube-official": { name: "Official YouTube (@ZZZ_Official / @ZZZ_JP)", handle: "Native YouTube Atom RSS", desc: "Native Atom RSS tracking Agent teasers, character demos, EPs & Special Programs." },
      "hpoi-figures": { name: "Hpoi Figure Database", handle: "hpoi.net · Pre-Order / Cutoff / Ship", desc: "Tracks pre-order opens, cutoffs, delays, and shipping dates for all ZZZ scale figures." },
      "weibo-official": { name: "Weibo Official (@ZZZ / @miHoYoGift)", handle: "Weibo Official Matrix", desc: "Fastest primary feed for CN brand collabs (KFC/Yadea), figure photos & merch drops." },
      "x-zzz-official": { name: "Official X Matrix (@ZZZ_EN / @ZZZ_JP)", handle: "@ZZZ_EN · @ZZZ_JP · @ZZZ_CHT", desc: "Monitors official EN/JP/CHT X accounts for global pop-ups, concerts, and teasers." },
      "bilibili-official": { name: "Bilibili Official Channel", handle: "UID 1636034895 · Official Channel", desc: "Syncs official Bilibili videos, PVs, EPs, and China offline expo announcements." },
      "apex-gsc-makers": { name: "APEX-TOYS & Good Smile Company", handle: "1/7 Scale Figures & Nendoroids", desc: "Primary licensed figure manufacturers releasing first prototypes and painted reveals." },
      "tmall-douyin-shops": { name: "Tmall ZZZ Official & Douyin Shop", handle: "miHoYoGift · ZZZ Studio · Douyin", desc: "Monitors regular merch drops, pre-order deadlines, and restocks every 30 min." },
      "cpp-allcpp": { name: "CPP Fan Convention Directory", handle: "allcpp.cn · Fan Only Expos", desc: "Discovers unofficial fan-run ZZZ Only expos and community live events." },
      "ticket-show-damai": { name: "Bilibili Ticketing & Damai", handle: "show.bilibili.com · Damai", desc: "Monitors ticket release waves for FES, ZLIVE concerts, and themed pop-ups." },
      "xhs-taptap": { name: "Xiaohongshu & TapTap Official", handle: "Pop-Up Photos · Platform Codes", desc: "Aggregates pop-up photos, merch unboxings, and platform-exclusive redeem codes." },
    },
  };
  const found = map[lang]?.[src.id];
  if (found) {
    return { ...src, name: found.name, desc: found.desc, handle: found.handle ?? src.handle };
  }
  return patchExtraSource(src, lang);
}
