/* ═══════════════════════════════════════════════════════════════
   AI CAREER DIAGNOSIS — script.js
   ルールベース診断エンジン + レーダーチャート + 画像書き出し
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ─────────────────────────────────────────────
     1. 指標（4軸）
     ───────────────────────────────────────────── */
  var DIMS = [
    { key: 'drive',   label: '推進力', desc: '決断と実行のスピード' },
    { key: 'logic',   label: '論理',   desc: '構造化と検証の精度' },
    { key: 'empathy', label: '共感',   desc: '人と情緒への感度' },
    { key: 'vision',  label: '構想',   desc: 'まだない未来への解像度' }
  ];

  /* ─────────────────────────────────────────────
     2. 質問（7問）
     d = 指標への加算 / t = タイプ親和
     ───────────────────────────────────────────── */
  var QUESTIONS = [
    {
      q: '新しいプロジェクトを任された。最初に手をつけるのは？',
      options: [
        { text: '全体像とゴールを、まず図に描く',
          d: { vision: 2, logic: 1 }, t: { architect: 2, observer: 1 } },
        { text: 'とりあえず小さく試して、走り出す',
          d: { drive: 2 }, t: { pioneer: 2, catalyst: 1 } },
        { text: '関係者に会って、温度感を確かめる',
          d: { empathy: 2 }, t: { catalyst: 2, resonator: 1 } },
        { text: '過去の類似事例とリスクを洗い出す',
          d: { logic: 2 }, t: { observer: 2, guardian: 1 } }
      ]
    },
    {
      q: 'チームの中で、あなたが自然に担う役割は？',
      options: [
        { text: '方向を決めて、最初に動き出す',
          d: { drive: 2, vision: 1 }, t: { pioneer: 2, catalyst: 1 } },
        { text: '論点を整理して、選択肢を絞る',
          d: { logic: 2 }, t: { architect: 2 } },
        { text: '人が動きやすい空気をつくる',
          d: { empathy: 2 }, t: { harmonizer: 2, catalyst: 1 } },
        { text: '誰も見ていない穴を、静かに埋める',
          d: { logic: 1, drive: 1 }, t: { guardian: 2, observer: 1 } }
      ]
    },
    {
      q: 'あなたが一番「もったいない」と感じるのは？',
      options: [
        { text: '決めるのに時間がかかり、機会を逃すこと',
          d: { drive: 2 }, t: { pioneer: 2, catalyst: 1 } },
        { text: '場当たり的な判断で、同じ失敗を繰り返すこと',
          d: { logic: 2, vision: 1 }, t: { architect: 2, seeker: 1 } },
        { text: '才能や想いが、伝わらないまま埋もれること',
          d: { empathy: 2, vision: 1 }, t: { resonator: 2 } },
        { text: '熱が上がりすぎて、足元が崩れること',
          d: { logic: 1, empathy: 1 }, t: { harmonizer: 2, guardian: 1 } }
      ]
    },
    {
      q: '難しい意思決定のとき、最後に背中を押すのは？',
      options: [
        { text: 'この先にある可能性の大きさ',
          d: { vision: 2 }, t: { seeker: 2, pioneer: 1 } },
        { text: '数字と、検証の結果',
          d: { logic: 2 }, t: { observer: 2, architect: 1 } },
        { text: '関わる人の表情と、納得感',
          d: { empathy: 2 }, t: { harmonizer: 2, resonator: 1, catalyst: 1 } },
        { text: '「自分がやるしかない」という責任感',
          d: { drive: 2, empathy: 1 }, t: { guardian: 2, pioneer: 1 } }
      ]
    },
    {
      q: '一人で集中したいとき、理想の環境は？',
      options: [
        { text: '静かな場所で、思考を深く潜らせる',
          d: { vision: 2, logic: 1 }, t: { seeker: 2 } },
        { text: '誰かと話しながら、アイデアが混ざる場所',
          d: { empathy: 2, vision: 1 }, t: { resonator: 2 } },
        { text: '進捗が見える場所。タスクが消えていく感覚',
          d: { drive: 2, logic: 1 }, t: { guardian: 2, pioneer: 1 } },
        { text: '情報が整理された、静かで整った場所',
          d: { logic: 2 }, t: { architect: 2, observer: 1 } }
      ]
    },
    {
      q: 'あなたの「やりがい」に、一番近いものは？',
      options: [
        { text: '誰もやっていないことを、成し遂げる',
          d: { vision: 2, drive: 1 }, t: { pioneer: 2, seeker: 1 } },
        { text: '複雑なものを、シンプルに解きほぐす',
          d: { logic: 2 }, t: { architect: 2, observer: 1 } },
        { text: '人の変化や、成長の瞬間に立ち会う',
          d: { empathy: 2 }, t: { catalyst: 2 } },
        { text: '安心して任される。期待に応え続ける',
          d: { drive: 1, logic: 1 }, t: { guardian: 2, harmonizer: 1 } }
      ]
    },
    {
      q: '5年後、どうなっていたい？',
      options: [
        { text: '自分の名前で、新しい領域を切り開いている',
          d: { vision: 2, drive: 1 }, t: { pioneer: 2, seeker: 1 } },
        { text: '専門性で、替えの効かない存在になっている',
          d: { logic: 2 }, t: { observer: 2, seeker: 2 } },
        { text: '良い仲間に囲まれ、影響を与え合っている',
          d: { empathy: 2 }, t: { resonator: 2, harmonizer: 1 } },
        { text: '生活と仕事が安定し、信頼を積み重ねている',
          d: { drive: 1, empathy: 1 }, t: { harmonizer: 2, guardian: 1 } }
      ]
    }
  ];

  /* ─────────────────────────────────────────────
     3. 8タイプ
     ───────────────────────────────────────────── */
  var TYPES = {
    pioneer: {
      jp: '先駆者', en: 'PIONEER',
      catch: '地図の外側に、道をつくる。',
      vec: { drive: 1.0, logic: 0.15, empathy: 0.25, vision: 0.85 },
      tags: ['決断が速い', '0→1が得意', '撤退判断も早い', '勢いで人を巻き込む'],
      analysis: [
        'あなたは、正解が用意されていない場所でこそ力が出るタイプです。情報が揃うのを待たずに動き、動きながら情報を集める。この順番の違いが周囲からは「大胆」に映りますが、あなたにとっては一番合理的な学習の仕方です。',
        '注意点は、あなたの速度に周囲がついてこられないこと。あなたが「もう決まったこと」として話しているとき、チームの半分はまだ文脈を掴めていません。結論を伝える前に、なぜそう考えたかを30秒だけ共有する。それだけで、あなたの推進力は何倍にもなります。'
      ],
      advice: '次に何かを始めるとき、最初の一歩を「明日」ではなく「今日の15分」に置き換えてみてください。あなたの強みは、完璧な計画より、動き出した事実からしか生まれません。ただし月に一度は立ち止まり、「これはまだやる価値があるか」を自問する時間を。速さは武器ですが、方向を間違えると、速さの分だけ遠回りになります。',
      env: [
        '変化が速く、前例がない領域（新規事業・立ち上げフェーズ）',
        '意思決定の権限が、現場に委ねられている組織',
        '成果を短いサイクルで確認できる環境',
        '細かいルールより、裁量が与えられる文化'
      ],
      affinity: [
        { id: 'catalyst', why: 'あなたの速度を、人の熱に変換してくれる' },
        { id: 'architect', why: 'あなたの勢いに、構造と再現性を与えてくれる' }
      ]
    },

    architect: {
      jp: '設計者', en: 'ARCHITECT',
      catch: '混沌を、構造に変える。',
      vec: { drive: 0.5, logic: 1.0, empathy: -0.1, vision: 0.85 },
      tags: ['全体像を描ける', '言語化が速い', '長期で考える', '無駄な工程に敏感'],
      analysis: [
        'あなたは、ばらばらの情報の中に「同じ構造」を見つけるのが得意なタイプです。目の前の作業を処理するより、その作業がどう繋がっているかを理解したい。だから新しい領域に入ったとき、まず地図を描こうとします。',
        'この力は、組織が大きくなるほど効きます。ただ、地図を描いている間は何も生まれていないように見えるため、評価が遅れがちです。「まだ考えている」ではなく「今この仮説を検証している」と言葉にすることが、あなたの貢献を可視化します。'
      ],
      advice: 'あなたの設計は、頭の中では完成していても、外に出さなければ存在しないのと同じです。60%の完成度で人に見せてください。残り40%は、たいてい他人の一言で埋まります。そして、あなたが「構造が汚い」と感じる作業こそ、誰かが毎日必死に回している現場です。壊す前に、敬意を払ってから直しましょう。',
      env: [
        '複雑な問題を整理する役割がある組織',
        '長期的な設計に関われるポジション',
        '思考の時間が、業務として確保される文化',
        '施策の意図を、言葉で説明できる上司がいる環境'
      ],
      affinity: [
        { id: 'pioneer', why: 'あなたの設計図を、現実の速度で動かしてくれる' },
        { id: 'seeker', why: 'あなたの構造に、まだ見ぬ問いを運んでくる' }
      ]
    },

    catalyst: {
      jp: '触媒', en: 'CATALYST',
      catch: '人の熱を、前進に変える。',
      vec: { drive: 0.85, logic: 0.15, empathy: 1.0, vision: 0.3 },
      tags: ['場の温度を上げる', '背中を押すのが上手い', '信頼の蓄積が速い', '人の成長が嬉しい'],
      analysis: [
        'あなたは、人が動き出す瞬間に立ち会うのが好きなタイプです。指示するのではなく、その人の中に「やれそう」という感覚をつくる。これは技術ではなく、あなたが相手を本気で見ているから成立する力です。',
        '一方で、あなたは自分の成果を後回しにしがちです。人の相談に乗っている時間は、数字には残りません。「誰の、何を前に進めたか」を記録しておく習慣が、あなたの評価を守ります。'
      ],
      advice: 'あなたが感じている「なんとなく疲れる」は、たぶん人が多すぎるのではなく、遠慮が足りないからです。断ることは、関係を切ることではありません。むしろ、断れない人が一番、長い目で見て信頼を失います。今週、一件だけ「今はできない」と伝えてみてください。',
      env: [
        '人の成長を、成果として評価する組織',
        '顧客や利用者と、近い距離で働ける仕事',
        'チームの規模が小さく、顔が見える環境',
        '自分で動く裁量がある文化'
      ],
      affinity: [
        { id: 'harmonizer', why: 'あなたの熱を、持続する仕組みに変えてくれる' },
        { id: 'pioneer', why: 'あなたの勇気に、進む方向を与えてくれる' }
      ]
    },

    observer: {
      jp: '観測者', en: 'OBSERVER',
      catch: '見えない穴を、先に見つける。',
      vec: { drive: -0.2, logic: 1.0, empathy: 0.3, vision: 0.15 },
      tags: ['検証が丁寧', '違和感に敏感', '例外処理が得意', '数字を鵜呑みにしない'],
      analysis: [
        'あなたは、みんなが見過ごした一点に気づくタイプです。会議で「これで大丈夫」と言われたとき、心の中ではすでに三つの懸念が並んでいる。それは冷めた性格ではなく、品質に対する責任感です。',
        'ただし、あなたの指摘は時期を間違えると「否定」として受け取られます。人が発見した瞬間に穴を指すのではなく、一晩置いてから、代替案とセットで渡す。同じ内容でも、通る確率がまったく変わります。'
      ],
      advice: 'あなたは「足りないもの」を見つけるのが得意ですが、同じ精度で「足りているもの」も数えてみてください。懸念を10個リストアップしたら、必ず良い点を3個書く。この癖がつくと、あなたの指摘は誰からも嫌がられなくなります。正確さは、伝わって初めて価値になります。',
      env: [
        '品質や正確性が、直接価値になる仕事',
        '検証と改善のサイクルが回っている組織',
        '意見を、根拠で議論する文化',
        '一人で集中できる作業時間が確保される環境'
      ],
      affinity: [
        { id: 'architect', why: 'あなたの検証を、全体の設計に組み込んでくれる' },
        { id: 'guardian', why: 'あなたの指摘を、確実な運用に落としてくれる' }
      ]
    },

    resonator: {
      jp: '共鳴者', en: 'RESONATOR',
      catch: '言葉にならない空気を、形にする。',
      vec: { drive: 0.15, logic: 0.05, empathy: 1.0, vision: 0.9 },
      tags: ['情緒を捉えるのが速い', '表現に独自性がある', '違和感を言語化できる', '好き嫌いが判断軸'],
      analysis: [
        'あなたは、論理より先に「しっくりくるかどうか」で物事を判断するタイプです。これは曖昧ではなく、多くの人が言語化できていない情報を、あなたが感覚で受け取っているだけです。実際、あなたの「なんか違う」には、後から理由がついてくることが多いはずです。',
        '難しいのは、その確信を説明する場面。感覚をそのまま伝えても、論理を求める相手には届きません。あなたの直感を、事実と数字で裏付ける作業を一度挟む。それだけで、あなたの発言は会議の結論を変えられるようになります。'
      ],
      advice: 'あなたの感性は、使えば使うほど磨かれますが、同時に消費もされます。インプットのない状態で出力し続けると、言葉が空っぽになります。予定に「何も生産しない時間」を先に入れてください。それは怠惰ではなく、あなたにとっての素材集めです。',
      env: [
        '表現や体験の質が、評価される仕事',
        '感覚を共有できる仲間がいるチーム',
        'ユーザーの感情に触れられる距離感',
        '決まった答えより、「らしさ」が求められる環境'
      ],
      affinity: [
        { id: 'catalyst', why: 'あなたの感覚を、人の行動に翻訳してくれる' },
        { id: 'architect', why: 'あなたの直感に、再現できる形を与えてくれる' }
      ]
    },

    harmonizer: {
      jp: '調整者', en: 'HARMONIZER',
      catch: '続く仕組みを、静かにつくる。',
      vec: { drive: 0.35, logic: 0.4, empathy: 0.85, vision: -0.25 },
      tags: ['摩擦を取り除く', '気配りが細かい', '継続が得意', '場の空気を読む'],
      analysis: [
        'あなたは、目立たないところで物事が壊れないようにしているタイプです。誰かが気を遣わなくても済むように、先回りして段取りを整える。その働きは、うまくいっているときこそ見えません。',
        '問題は、あなたが「言わなくても分かってくれる」ことを期待しやすい点です。残念ながら、あなたの気遣いの9割は気づかれていません。不当に扱われているのではなく、単に伝わっていないだけです。言葉にして初めて、それは評価に変わります。'
      ],
      advice: 'あなたが「私がやらなくても誰かがやる」と思って手を引いた仕事は、たぶん誰もやりません。それは、あなたの重要性の証拠です。ただし、すべてを引き受ける必要もありません。手放していい仕事を一つ選び、代わりにあなたが一番やりたい仕事を一つ選ぶ。その交換だけを、今週やってみてください。',
      env: [
        '長期的な関係を、築ける仕事',
        'チームの土台を支える役割が、評価される組織',
        '急激な変化より、安定した成長を志向する環境',
        '感謝が、きちんと言葉になる文化'
      ],
      affinity: [
        { id: 'catalyst', why: 'あなたの丁寧さに、推進力を足してくれる' },
        { id: 'guardian', why: 'あなたの気配りを、仕組みとして残してくれる' }
      ]
    },

    seeker: {
      jp: '探求者', en: 'SEEKER',
      catch: 'まだ名前のない問いを、追いかける。',
      vec: { drive: -0.2, logic: 0.65, empathy: 0.15, vision: 1.0 },
      tags: ['好奇心が持続する', '深く潜れる', '流行に流されない', '一人の時間が大事'],
      analysis: [
        'あなたは、答えを得ることより、問いを深めることに喜びを感じるタイプです。誰かが正解を出した瞬間に興味を失い、次のまだ分からないものへ移っていく。その落ち着かなさは、飽きっぽさではなく、探究心の持続力です。',
        'ただし、あなたの価値は外からは見えにくい。研究中の時間は、何も生んでいないように見えます。「今わかったこと」を定期的に小さく共有する習慣を持つと、あなたの探索は、周囲の理解と支援を得られます。'
      ],
      advice: 'あなたは「これをやる意味はあるか」を考えすぎるあまり、始めるのが遅くなることがあります。意味は、始めた後にしか立ち上がりません。また、あなたの知識は、誰かに教えた瞬間に倍になります。月に一度でいいので、学んだことを人に話す場を作ってください。それが、あなたの孤立を防ぎます。',
      env: [
        '専門性を、とことん深められる環境',
        '成果までの時間が長くても、許容される組織',
        '知的な刺激がある同僚がいる職場',
        '自分のペースを守れる裁量'
      ],
      affinity: [
        { id: 'architect', why: 'あなたの探究に、外から見える形を与えてくれる' },
        { id: 'resonator', why: 'あなたの問いに、感情の温度を足してくれる' }
      ]
    },

    guardian: {
      jp: '守護者', en: 'GUARDIAN',
      catch: '任されたものを、最後まで守り切る。',
      vec: { drive: 0.8, logic: 0.6, empathy: 0.25, vision: -0.45 },
      tags: ['約束を守る', '最後までやり切る', '抜け漏れが少ない', '信頼の蓄積が厚い'],
      analysis: [
        'あなたは、引き受けたことを終わらせる力が異常に高いタイプです。特別な才能ではなく、「途中で投げ出さない」という一点において、あなたは大多数より強い。組織の中で、この性質は最も希少です。',
        '一方で、あなたは頼まれると断れず、気づけば限界まで抱えています。そして、抱えていることを誰にも言いません。結果として、ある日突然動けなくなります。それは根性の問題ではなく、設計の問題です。'
      ],
      advice: 'あなたの「まだ大丈夫です」は、周囲には「余裕がある」と聞こえています。これは危険な翻訳です。週に一度、手元のタスクを全部書き出し、そのうち一つを人に渡してください。あなたが抜けた瞬間に崩れる仕組みは、あなたのせいではなく、仕組みのせいです。任せることも、仕事のうちです。',
      env: [
        '信頼と継続が、価値になる仕事',
        '責任範囲が、明確に定まっている組織',
        '長く関係を築ける、顧客や取引先',
        '手柄が正当に評価される、公正な制度'
      ],
      affinity: [
        { id: 'harmonizer', why: 'あなたの実行力を、無理のない配分に整えてくれる' },
        { id: 'observer', why: 'あなたの見落としを、着手前に拾ってくれる' }
      ]
    }
  };

  var TYPE_IDS = Object.keys(TYPES);

  /* ─────────────────────────────────────────────
     4. 指標の理論最大値（レーダー正規化用）
     ───────────────────────────────────────────── */
  var DIM_MAX = {};
  DIMS.forEach(function (dim) {
    var max = 0;
    QUESTIONS.forEach(function (q) {
      var m = 0;
      q.options.forEach(function (o) { m = Math.max(m, o.d[dim.key] || 0); });
      max += m;
    });
    DIM_MAX[dim.key] = max || 1;
  });

  /* ─────────────────────────────────────────────
     5. 状態
     ───────────────────────────────────────────── */
  var state = { index: 0, answers: [], dims: null, result: null };

  /* ─────────────────────────────────────────────
     6. DOM
     ───────────────────────────────────────────── */
  var $ = function (id) { return document.getElementById(id); };
  var screens = {
    intro: $('screen-intro'),
    quiz: $('screen-quiz'),
    analyzing: $('screen-analyzing'),
    result: $('screen-result')
  };

  var el = {
    startBtn: $('startBtn'),
    backBtn: $('backBtn'),
    progressFill: $('progressFill'),
    progressBar: $('progressBar'),
    quizCount: $('quizCount'),
    quizEyebrow: $('quizEyebrow'),
    quizQuestion: $('quizQuestion'),
    options: $('options'),
    ringArc: $('ringArc'),
    analyzePct: $('analyzePct'),
    analyzingLog: $('analyzingLog'),
    cardDate: $('cardDate'),
    typeEn: $('typeEn'),
    typeJp: $('typeJp'),
    typeCatch: $('typeCatch'),
    radar: $('radar'),
    typeTags: $('typeTags'),
    hybridNote: $('hybridNote'),
    analysisText: $('analysisText'),
    metrics: $('metrics'),
    metricsNote: $('metricsNote'),
    envList: $('envList'),
    adviceText: $('adviceText'),
    affinityList: $('affinityList'),
    shareBtn: $('shareBtn'),
    shareLabel: $('shareLabel'),
    shareXBtn: $('shareXBtn'),
    shareLineBtn: $('shareLineBtn'),
    shareCopyBtn: $('shareCopyBtn'),
    shareUrlText: $('shareUrlText'),
    saveBtn: $('saveBtn'),
    retryBtn: $('retryBtn'),
    toast: $('toast'),
    themeToggle: $('themeToggle')
  };

  /* ─────────────────────────────────────────────
     7. ユーティリティ
     ───────────────────────────────────────────── */
  function showScreen(name) {
    Object.keys(screens).forEach(function (k) {
      screens[k].classList.toggle('is-active', k === name);
    });
    window.scrollTo({ top: 0, behavior: 'auto' });
  }

  var toastTimer = null;
  function toast(msg) {
    el.toast.textContent = msg;
    el.toast.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.toast.classList.remove('is-on'); }, 2400);
  }

  function div(html) {
    var d = document.createElement('div');
    d.innerHTML = html;
    return d;
  }

  var ICON_CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>';

  /* ─────────────────────────────────────────────
     8. Intro → Quiz
     ───────────────────────────────────────────── */
  el.startBtn.addEventListener('click', function () {
    state.index = 0;
    state.answers = [];
    state.dims = null;
    state.result = null;
    showScreen('quiz');
    renderQuestion();
  });

  el.retryBtn.addEventListener('click', function () {
    state.index = 0;
    state.answers = [];
    state.dims = null;
    state.result = null;
    showScreen('intro');
  });

  el.backBtn.addEventListener('click', function () {
    if (state.index === 0) return;
    state.index -= 1;
    state.answers.pop();
    renderQuestion();
  });

  /* ─────────────────────────────────────────────
     9. 質問の描画
     ───────────────────────────────────────────── */
  function renderQuestion() {
    var i = state.index;
    var q = QUESTIONS[i];
    var total = QUESTIONS.length;

    el.quizEyebrow.textContent = 'QUESTION ' + (i < 9 ? '0' : '') + (i + 1);
    el.quizQuestion.textContent = q.q;
    el.quizCount.textContent = (i + 1) + ' / ' + total;

    var pct = (i / total) * 100;
    el.progressFill.style.width = pct + '%';
    el.progressBar.setAttribute('aria-valuenow', String(Math.round(pct)));
    el.backBtn.disabled = i === 0;

    el.options.innerHTML = '';
    var keys = ['A', 'B', 'C', 'D'];

    q.options.forEach(function (opt, oi) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'option';
      btn.style.animationDelay = (0.06 + oi * 0.07) + 's';
      btn.innerHTML =
        '<span class="option-key">' + keys[oi] + '</span>' +
        '<span class="option-text"></span>';
      btn.querySelector('.option-text').textContent = opt.text;
      btn.addEventListener('click', function () { chooseOption(oi, btn); });
      el.options.appendChild(btn);
    });

    // 再アニメーション
    var body = screens.quiz.querySelector('.quiz-body');
    body.style.animation = 'none';
    void body.offsetWidth;
    body.style.animation = '';
  }

  function chooseOption(oi, btn) {
    if (el.options.dataset.locked === '1') return;
    el.options.dataset.locked = '1';

    btn.classList.add('is-picked');
    Array.prototype.forEach.call(el.options.children, function (c) {
      if (c !== btn) c.classList.add('is-fading');
    });

    state.answers[state.index] = oi;

    setTimeout(function () {
      el.options.dataset.locked = '0';
      if (state.index < QUESTIONS.length - 1) {
        state.index += 1;
        renderQuestion();
      } else {
        el.progressFill.style.width = '100%';
        el.progressBar.setAttribute('aria-valuenow', '100');
        runAnalysis();
      }
    }, 340);
  }

  /* ─────────────────────────────────────────────
     10. 診断エンジン
     ───────────────────────────────────────────── */
  function computeDims() {
    var dims = {};
    DIMS.forEach(function (d) { dims[d.key] = 0; });

    state.answers.forEach(function (oi, qi) {
      var opt = QUESTIONS[qi].options[oi];
      Object.keys(opt.d).forEach(function (k) { dims[k] += opt.d[k]; });
    });
    return dims;
  }

  function computeAffinity() {
    var aff = {};
    TYPE_IDS.forEach(function (id) { aff[id] = 0; });

    state.answers.forEach(function (oi, qi) {
      var opt = QUESTIONS[qi].options[oi];
      Object.keys(opt.t).forEach(function (id) { aff[id] += opt.t[id]; });
    });
    return aff;
  }

  // 平均を引いて単位ベクトル化 → コサイン類似度
  function toUnitVector(obj, keys) {
    var vals = keys.map(function (k) { return obj[k]; });
    var mean = vals.reduce(function (a, b) { return a + b; }, 0) / vals.length;
    var centered = vals.map(function (v) { return v - mean; });
    var norm = Math.sqrt(centered.reduce(function (a, v) { return a + v * v; }, 0)) || 1;
    return centered.map(function (v) { return v / norm; });
  }

  function computeResult(dims) {
    var aff = computeAffinity();
    var keys = DIMS.map(function (d) { return d.key; });
    var uVec = toUnitVector(dims, keys);

    var scored = TYPE_IDS.map(function (id) {
      var tVec = toUnitVector(TYPES[id].vec, keys);
      var cos = tVec.reduce(function (a, v, i) { return a + v * uVec[i]; }, 0);
      return { id: id, score: aff[id] + cos * 5.6, cos: cos };
    });

    scored.sort(function (a, b) { return b.score - a.score; });

    var best = scored[0];
    var second = scored[1];
    var isHybrid = second.score >= best.score * 0.88;

    return {
      id: best.id,
      type: TYPES[best.id],
      scores: scored,
      hybrid: isHybrid ? TYPES[second.id] : null,
      dims: dims
    };
  }

  function dimPercents(dims) {
    var out = {};
    DIMS.forEach(function (d) {
      var ratio = dims[d.key] / DIM_MAX[d.key];
      out[d.key] = Math.max(14, Math.min(100, Math.round(16 + ratio * 84)));
    });
    return out;
  }

  /* ─────────────────────────────────────────────
     11. 解析中アニメーション
     ───────────────────────────────────────────── */
  var LOGS = [
    '回答パターンを読み込んでいます',
    '4つの指標を照合しています',
    '8タイプとの類似度を計算しています',
    'あなたの原型を特定しました'
  ];

  function runAnalysis() {
    showScreen('analyzing');

    var CIRC = 2 * Math.PI * 52; // 326.7
    el.ringArc.style.strokeDasharray = CIRC.toFixed(1);

    var duration = 2000;
    var start = performance.now();
    var logIdx = 0;

    el.analyzingLog.style.opacity = '1';
    el.analyzingLog.textContent = LOGS[0];

    var logTimer = setInterval(function () {
      logIdx += 1;
      if (logIdx >= LOGS.length) { clearInterval(logTimer); return; }
      el.analyzingLog.style.opacity = '0';
      setTimeout(function () {
        el.analyzingLog.textContent = LOGS[logIdx];
        el.analyzingLog.style.opacity = '1';
      }, 140);
    }, duration / LOGS.length);

    function frame(now) {
      var t = (now - start) / duration;
      if (!isFinite(t) || t < 0) t = 0;
      if (t > 1) t = 1;
      var eased = 1 - Math.pow(1 - t, 2.2);

      el.ringArc.style.strokeDashoffset = String(CIRC * (1 - eased));
      el.analyzePct.textContent = Math.round(eased * 100) + '%';

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        complete();
      }
    }

    // 解析完了 → 結果画面へ（多重実行はガード）
    var finished = false;
    function complete() {
      if (finished) return;
      finished = true;
      clearInterval(logTimer);
      el.ringArc.style.strokeDashoffset = '0';
      el.analyzePct.textContent = '100%';

      var dims = computeDims();
      state.dims = dims;
      state.result = computeResult(dims);

      setTimeout(function () {
        renderResult();
        showScreen('result');
      }, 220);
    }

    requestAnimationFrame(frame);
    // 保険: rAF が止まる環境（バックグラウンドタブ等）でも必ず結果に到達させる
    setTimeout(complete, duration + 900);
  }

  /* ─────────────────────────────────────────────
     12. レーダーチャート
     ───────────────────────────────────────────── */
  function radarPoints(pcts) {
    var cx = 120, cy = 120, R = 78;
    return DIMS.map(function (d, i) {
      var ang = (-90 + i * 90) * Math.PI / 180;
      var r = R * (pcts[d.key] / 100);
      return {
        x: cx + r * Math.cos(ang),
        y: cy + r * Math.sin(ang)
      };
    });
  }

  function renderRadar(pcts) {
    var cx = 120, cy = 120, R = 78;
    var ns = 'http://www.w3.org/2000/svg';
    var svg = el.radar;
    svg.innerHTML = '';

    // defs: gradient fill
    var defs = document.createElementNS(ns, 'defs');
    defs.innerHTML =
      '<radialGradient id="radarFill" cx="50%" cy="50%" r="50%">' +
        '<stop offset="0%" stop-color="#35dfe4" stop-opacity=".55"/>' +
        '<stop offset="100%" stop-color="#5b4bff" stop-opacity=".30"/>' +
      '</radialGradient>';
    svg.appendChild(defs);

    // grid rings
    [0.25, 0.5, 0.75, 1].forEach(function (f) {
      var pts = DIMS.map(function (d, i) {
        var ang = (-90 + i * 90) * Math.PI / 180;
        var r = R * f;
        return (cx + r * Math.cos(ang)).toFixed(1) + ',' + (cy + r * Math.sin(ang)).toFixed(1);
      }).join(' ');
      var poly = document.createElementNS(ns, 'polygon');
      poly.setAttribute('points', pts);
      poly.setAttribute('class', 'grid-poly');
      svg.appendChild(poly);
    });

    // axes + labels
    DIMS.forEach(function (d, i) {
      var ang = (-90 + i * 90) * Math.PI / 180;
      var line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', cx); line.setAttribute('y1', cy);
      line.setAttribute('x2', (cx + R * Math.cos(ang)).toFixed(1));
      line.setAttribute('y2', (cy + R * Math.sin(ang)).toFixed(1));
      line.setAttribute('class', 'axis-line');
      svg.appendChild(line);

      var lr = 100;
      var lx = cx + lr * Math.cos(ang);
      var ly = cy + lr * Math.sin(ang);
      var anchor = 'middle';
      if (Math.abs(Math.cos(ang)) > 0.5) anchor = Math.cos(ang) > 0 ? 'end' : 'start';

      var txt = document.createElementNS(ns, 'text');
      txt.setAttribute('x', lx.toFixed(1));
      txt.setAttribute('y', (ly + 4).toFixed(1));
      txt.setAttribute('text-anchor', anchor);
      txt.setAttribute('class', 'radar-label');
      txt.textContent = d.label;
      svg.appendChild(txt);
    });

    // data polygon
    var pts = radarPoints(pcts);
    var poly = document.createElementNS(ns, 'polygon');
    poly.setAttribute('points', pts.map(function (p) {
      return p.x.toFixed(1) + ',' + p.y.toFixed(1);
    }).join(' '));
    poly.setAttribute('class', 'data-poly');
    svg.appendChild(poly);

    pts.forEach(function (p) {
      var c = document.createElementNS(ns, 'circle');
      c.setAttribute('cx', p.x.toFixed(1));
      c.setAttribute('cy', p.y.toFixed(1));
      c.setAttribute('r', '3');
      c.setAttribute('class', 'data-dot');
      svg.appendChild(c);
    });
  }

  /* ─────────────────────────────────────────────
     13. 結果の描画
     ───────────────────────────────────────────── */
  function todayLabel() {
    var d = new Date();
    var p = function (n) { return n < 10 ? '0' + n : String(n); };
    return d.getFullYear() + '.' + p(d.getMonth() + 1) + '.' + p(d.getDate());
  }

  function renderResult() {
    var r = state.result;
    var t = r.type;
    var pcts = dimPercents(r.dims);

    el.cardDate.textContent = todayLabel();
    el.typeEn.textContent = t.en;
    el.typeJp.textContent = t.jp;
    el.typeCatch.textContent = t.catch;

    renderRadar(pcts);

    // traits
    el.typeTags.innerHTML = '';
    t.tags.forEach(function (tag, i) {
      var s = document.createElement('span');
      s.className = 'trait';
      s.style.animationDelay = (0.45 + i * 0.07) + 's';
      s.textContent = tag;
      el.typeTags.appendChild(s);
    });

    // hybrid
    if (r.hybrid) {
      el.hybridNote.hidden = false;
      el.hybridNote.innerHTML =
        '<strong>' + t.jp + '</strong> と <strong>' + r.hybrid.jp +
        '</strong> のハイブリッド型。あなたの回答は、この2つの原型のあいだに着地しました。';
    } else {
      el.hybridNote.hidden = true;
      el.hybridNote.innerHTML = '';
    }

    // analysis
    el.analysisText.innerHTML = '';
    t.analysis.forEach(function (p) {
      var node = document.createElement('p');
      node.textContent = p;
      el.analysisText.appendChild(node);
    });

    // metrics
    el.metrics.innerHTML = '';
    var sorted = DIMS.slice().sort(function (a, b) {
      return pcts[b.key] - pcts[a.key];
    });

    DIMS.forEach(function (d) {
      var row = div(
        '<div class="metric-head">' +
          '<span class="metric-name"><b>' + d.label + '</b>　' + d.desc + '</span>' +
          '<span class="metric-value">' + pcts[d.key] + '</span>' +
        '</div>' +
        '<div class="metric-bar"><div class="metric-fill"></div></div>'
      );
      el.metrics.appendChild(row);
      var fill = row.querySelector('.metric-fill');
      setTimeout(function () { fill.style.width = pcts[d.key] + '%'; }, 60);
    });

    el.metricsNote.textContent =
      'もっとも高い指標は「' + sorted[0].label + '」、もっとも低いのは「' +
      sorted[sorted.length - 1].label + '」でした。この高低差こそが、あなたの「' +
      t.jp + '」らしさの輪郭です。';

    // env
    el.envList.innerHTML = '';
    t.env.forEach(function (line) {
      var li = document.createElement('li');
      li.innerHTML = ICON_CHECK;
      var span = document.createElement('span');
      span.textContent = line;
      li.appendChild(span);
      el.envList.appendChild(li);
    });

    // advice
    el.adviceText.textContent = t.advice;

    // affinity
    el.affinityList.innerHTML = '';
    t.affinity.forEach(function (a) {
      var other = TYPES[a.id];
      var row = div(
        '<div class="affinity-item">' +
          '<div class="affinity-badge">' + other.jp.charAt(0) + '</div>' +
          '<div class="affinity-body">' +
            '<div class="affinity-name">' + other.jp + '　<span style="font-weight:500;font-size:11px;letter-spacing:.14em;color:var(--text-3)">' + other.en + '</span></div>' +
            '<div class="affinity-why">' + a.why + '</div>' +
          '</div>' +
        '</div>'
      );
      el.affinityList.appendChild(row);
    });

    // 結果パネルを順にフェードイン
    var panels = document.querySelectorAll('.result-body .panel');
    Array.prototype.forEach.call(panels, function (p, i) {
      p.style.animation = 'none';
      void p.offsetWidth;
      p.style.animation = '';
      p.style.animationDelay = (0.15 + i * 0.08) + 's';
    });
  }

  /* ─────────────────────────────────────────────
     14. 共有テキスト
     ───────────────────────────────────────────── */
  function buildShareText() {
    var r = state.result;
    if (!r) return '';
    var t = r.type;
    var pcts = dimPercents(r.dims);

    var bars = DIMS.map(function (d) {
      var n = Math.round(pcts[d.key] / 10);
      var bar = '';
      for (var i = 0; i < 10; i++) bar += i < n ? '█' : '░';
      return d.label + ' ' + bar + ' ' + pcts[d.key];
    }).join('\n');

    var lines = [
      '【AI仕事タイプ診断】',
      '私の原型は「' + t.jp + ' / ' + t.en + '」でした。',
      '',
      '「' + t.catch + '」',
      '',
      bars
    ];

    if (r.hybrid) {
      lines.push('');
      lines.push('※ ' + t.jp + ' と ' + r.hybrid.jp + ' のハイブリッド型');
    }

    lines.push('');
    lines.push('#AI仕事タイプ診断  #' + t.jp);

    return lines.join('\n');
  }

  async function copyText(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      }
    } catch (e) { /* fallthrough */ }

    try {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.cssText = 'position:absolute;left:-9999px;top:0';
      document.body.appendChild(ta);
      ta.select();
      var ok = document.execCommand('copy');
      document.body.removeChild(ta);
      return ok;
    } catch (e) {
      return false;
    }
  }

  el.shareBtn.addEventListener('click', async function () {
    var text = buildShareText();
    if (!text) return;

    var canShareFiles = false;
    var file = null;

    try {
      var blob = await renderCardBlob();
      if (blob && navigator.canShare && window.File) {
        file = new File([blob], 'ai-career-' + state.result.id + '.png', { type: 'image/png' });
        canShareFiles = navigator.canShare({ files: [file] });
      }
    } catch (e) { canShareFiles = false; }

    if (navigator.share) {
      try {
        if (canShareFiles && file) {
          await navigator.share({ files: [file], text: text, title: 'AI仕事タイプ診断' });
        } else {
          await navigator.share({ text: text, title: 'AI仕事タイプ診断' });
        }
        return;
      } catch (err) {
        if (err && err.name === 'AbortError') return; // ユーザーがキャンセル
      }
    }

    var ok = await copyText(text);
    toast(ok ? '診断結果をコピーしました' : 'コピーできませんでした');
  });

  /* ─────────────────────────────────────────────
     14.5 バイラル共有（X / LINE / リンクコピー）
     ───────────────────────────────────────────── */
  var SHARE_URL = 'https://www.reveriel.com/ai-diagnosis/';
  var SHARE_SITE = 'AI仕事タイプ診断';

  // 晒し用の短い1行テキスト（結果名 + 誘導）
  function buildShareTextShort() {
    var r = state.result;
    if (!r) return '';
    return '私の仕事の原型は【' + r.type.jp + '】でした。あなたは？→';
  }

  function buildXShareUrl() {
    var r = state.result;
    if (!r) return '';
    var params = [
      'text=' + encodeURIComponent(buildShareTextShort()),
      'url=' + encodeURIComponent(SHARE_URL),
      'hashtags=' + encodeURIComponent(SHARE_SITE + ',' + r.type.jp)
    ];
    return 'https://twitter.com/intent/tweet?' + params.join('&');
  }

  function buildLineShareUrl() {
    var text = buildShareTextShort();
    // LINE のメッセージ送信ディープリンク（本文 + URL を一緒に送れる）
    return 'https://line.me/R/msg/text/?' +
      encodeURIComponent(text + '\n' + SHARE_URL);
  }

  // ユーザー操作起点で新規タブを開く（ポップアップブロック回避のため a 要素を使う）
  function openExternal(url) {
    if (!url) return;
    var a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  el.shareXBtn.addEventListener('click', function () {
    if (!state.result) return;
    openExternal(buildXShareUrl());
    toast('Xの投稿画面を開きました');
  });

  el.shareLineBtn.addEventListener('click', function () {
    if (!state.result) return;
    openExternal(buildLineShareUrl());
  });

  el.shareCopyBtn.addEventListener('click', async function () {
    var ok = await copyText(SHARE_URL);
    toast(ok ? 'リンクをコピーしました' : 'コピーできませんでした');
  });

  if (el.shareUrlText) el.shareUrlText.textContent = SHARE_URL;

  /* ─────────────────────────────────────────────
     15. 結果カードの画像書き出し（Canvas 2D）
     ───────────────────────────────────────────── */
  var CARD_W = 1080;
  var CARD_H = 1350;
  var FONT = '"Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", "Yu Gothic", sans-serif';

  function roundRect(ctx, x, y, w, h, r) {
    if (typeof ctx.roundRect === 'function') {
      ctx.beginPath();
      ctx.roundRect(x, y, w, h, r);
      return;
    }
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  function drawSpaced(ctx, text, x, y, spacing, align) {
    var chars = String(text).split('');
    var width = 0;
    chars.forEach(function (c, i) {
      width += ctx.measureText(c).width + (i < chars.length - 1 ? spacing : 0);
    });
    var cx = x;
    if (align === 'center') cx = x - width / 2;
    if (align === 'right') cx = x - width;
    chars.forEach(function (c, i) {
      ctx.fillText(c, cx, y);
      cx += ctx.measureText(c).width + spacing;
    });
  }

  function wrapLines(ctx, text, maxWidth) {
    var chars = String(text).split('');
    var lines = [];
    var line = '';
    chars.forEach(function (c) {
      var test = line + c;
      if (ctx.measureText(test).width > maxWidth && line !== '') {
        lines.push(line);
        line = c;
      } else {
        line = test;
      }
    });
    if (line) lines.push(line);
    return lines;
  }

  function drawCard(ctx, r) {
    var t = r.type;
    var pcts = dimPercents(r.dims);
    var PAD = 76;

    // background
    var bg = ctx.createLinearGradient(0, 0, CARD_W, CARD_H);
    bg.addColorStop(0, '#141733');
    bg.addColorStop(0.55, '#0b0d1c');
    bg.addColorStop(1, '#101a2e');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, CARD_W, CARD_H);

    // glow
    var g1 = ctx.createRadialGradient(880, 120, 0, 880, 120, 560);
    g1.addColorStop(0, 'rgba(91,75,255,.55)');
    g1.addColorStop(1, 'rgba(91,75,255,0)');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, CARD_W, CARD_H);

    var g2 = ctx.createRadialGradient(120, 1180, 0, 120, 1180, 520);
    g2.addColorStop(0, 'rgba(0,194,199,.30)');
    g2.addColorStop(1, 'rgba(0,194,199,0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, CARD_W, CARD_H);

    // grid
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,.055)';
    ctx.lineWidth = 1;
    for (var gx = 0; gx <= CARD_W; gx += 68) {
      ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, CARD_H); ctx.stroke();
    }
    for (var gy = 0; gy <= CARD_H; gy += 68) {
      ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(CARD_W, gy); ctx.stroke();
    }
    ctx.restore();

    // ── top bar ──
    ctx.fillStyle = 'rgba(255,255,255,.42)';
    ctx.font = '700 22px ' + FONT;
    drawSpaced(ctx, 'AI CAREER DIAGNOSIS', PAD, 118, 4.2, 'left');

    ctx.font = '400 22px ' + FONT;
    ctx.fillStyle = 'rgba(255,255,255,.42)';
    drawSpaced(ctx, todayLabel(), CARD_W - PAD, 118, 3, 'right');

    ctx.strokeStyle = 'rgba(255,255,255,.16)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD, 152); ctx.lineTo(CARD_W - PAD, 152);
    ctx.stroke();

    // ── type ──
    ctx.fillStyle = '#35dfe4';
    ctx.font = '700 28px ' + FONT;
    drawSpaced(ctx, t.en, PAD, 250, 9, 'left');

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 116px ' + FONT;
    ctx.fillText(t.jp, PAD - 6, 372);

    ctx.fillStyle = 'rgba(255,255,255,.70)';
    ctx.font = '400 32px ' + FONT;
    ctx.fillText(t.catch, PAD, 436);

    // ── radar ──
    var cx = CARD_W / 2, cy = 706, R = 196;

    ctx.save();
    for (var ri = 1; ri <= 4; ri++) {
      ctx.beginPath();
      var pts = DIMS.map(function (d, i) {
        var ang = (-90 + i * 90) * Math.PI / 180;
        var rr = R * (ri / 4);
        return [cx + rr * Math.cos(ang), cy + rr * Math.sin(ang)];
      });
      pts.forEach(function (p, i) {
        if (i === 0) ctx.moveTo(p[0], p[1]);
        else ctx.lineTo(p[0], p[1]);
      });
      ctx.closePath();
      ctx.strokeStyle = 'rgba(255,255,255,.13)';
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }

    // axes
    DIMS.forEach(function (d, i) {
      var ang = (-90 + i * 90) * Math.PI / 180;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + R * Math.cos(ang), cy + R * Math.sin(ang));
      ctx.strokeStyle = 'rgba(255,255,255,.13)';
      ctx.stroke();
    });

    // data polygon
    var dataPts = DIMS.map(function (d, i) {
      var ang = (-90 + i * 90) * Math.PI / 180;
      var rr = R * (pcts[d.key] / 100);
      return [cx + rr * Math.cos(ang), cy + rr * Math.sin(ang)];
    });

    ctx.beginPath();
    dataPts.forEach(function (p, i) {
      if (i === 0) ctx.moveTo(p[0], p[1]);
      else ctx.lineTo(p[0], p[1]);
    });
    ctx.closePath();
    var fillGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    fillGrad.addColorStop(0, 'rgba(53,223,228,.55)');
    fillGrad.addColorStop(1, 'rgba(91,75,255,.32)');
    ctx.fillStyle = fillGrad;
    ctx.fill();
    ctx.strokeStyle = '#35dfe4';
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.stroke();

    dataPts.forEach(function (p) {
      ctx.beginPath();
      ctx.arc(p[0], p[1], 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = '#35dfe4';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    });

    // radar labels
    ctx.font = '700 27px ' + FONT;
    ctx.fillStyle = 'rgba(255,255,255,.72)';
    DIMS.forEach(function (d, i) {
      var ang = (-90 + i * 90) * Math.PI / 180;
      var lr = R + 50;
      var lx = cx + lr * Math.cos(ang);
      var ly = cy + lr * Math.sin(ang) + 9;
      ctx.textAlign = 'center';
      if (Math.abs(Math.cos(ang)) > 0.5) {
        ctx.textAlign = Math.cos(ang) > 0 ? 'right' : 'left';
      }
      ctx.fillText(d.label, lx, ly);
    });
    ctx.textAlign = 'left';
    ctx.restore();

    // ── traits ──
    var pillX = PAD;
    var pillY = 1000;
    var pillH = 58;
    ctx.font = '600 26px ' + FONT;
    t.tags.forEach(function (tag) {
      var w = ctx.measureText(tag).width + 46;
      if (pillX + w > CARD_W - PAD) {
        pillX = PAD;
        pillY += pillH + 14;
      }
      roundRect(ctx, pillX, pillY, w, pillH, 29);
      ctx.fillStyle = 'rgba(255,255,255,.09)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,.16)';
      ctx.lineWidth = 1.4;
      ctx.stroke();

      ctx.fillStyle = 'rgba(255,255,255,.95)';
      ctx.fillText(tag, pillX + 23, pillY + 39);
      pillX += w + 12;
    });

    var afterTags = pillY + pillH + 26;

    // ── hybrid ──
    if (r.hybrid) {
      ctx.font = '400 25px ' + FONT;
      ctx.fillStyle = 'rgba(255,255,255,.62)';
      var hl = wrapLines(ctx, t.jp + ' × ' + r.hybrid.jp + ' のハイブリッド型', CARD_W - PAD * 2);
      hl.forEach(function (line, i) {
        ctx.fillText(line, PAD, afterTags + 22 + i * 36);
      });
      afterTags += hl.length * 36 + 16;
    }

    // ── footer ──
    ctx.strokeStyle = 'rgba(255,255,255,.16)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PAD, CARD_H - 118);
    ctx.lineTo(CARD_W - PAD, CARD_H - 118);
    ctx.stroke();

    var fg = ctx.createLinearGradient(PAD, 0, PAD + 42, 0);
    fg.addColorStop(0, '#5b4bff');
    fg.addColorStop(1, '#35dfe4');
    ctx.fillStyle = fg;
    ctx.fillRect(PAD, CARD_H - 92, 42, 5);

    ctx.fillStyle = 'rgba(255,255,255,.45)';
    ctx.font = '400 22px ' + FONT;
    drawSpaced(ctx, 'ANATA NO SHIGOTO NO GENKEI', PAD + 60, CARD_H - 84, 2.6, 'left');

    // 回遊用URL（結果カード内で最も目立つ誘導）
    ctx.textAlign = 'right';
    ctx.fillStyle = '#35dfe4';
    ctx.font = '700 25px ' + FONT;
    ctx.fillText('www.reveriel.com/ai-diagnosis', CARD_W - PAD, CARD_H - 82);
    ctx.textAlign = 'left';
  }

  function renderCardBlob() {
    return new Promise(function (resolve) {
      if (!state.result) { resolve(null); return; }
      try {
        var canvas = document.createElement('canvas');
        canvas.width = CARD_W;
        canvas.height = CARD_H;
        var ctx = canvas.getContext('2d');

        var finish = function () {
          if (canvas.toBlob) {
            canvas.toBlob(function (b) { resolve(b); }, 'image/png');
          } else {
            resolve(null);
          }
        };

        // フォント確定後に描画する（メトリクスずれ防止）
        var draw = function () {
          try { drawCard(ctx, state.result); } catch (e) {}
          finish();
        };

        if (document.fonts && document.fonts.ready) {
          var drawn = false;
          var once = function () {
            if (drawn) { return; }
            drawn = true;
            draw();
          };
          document.fonts.ready.then(once).catch(once);
          // fonts.ready が解決しない環境でも必ず描画できるようタイムアウト競走させる
          setTimeout(once, 1500);
        } else {
          draw();
        }
      } catch (e) {
        resolve(null);
      }
    });
  }

  el.saveBtn.addEventListener('click', async function () {
    var btn = el.saveBtn;
    btn.disabled = true;
    var blob = await renderCardBlob();

    if (!blob) {
      btn.disabled = false;
      toast('画像を生成できませんでした。スクリーンショットをお使いください');
      return;
    }

    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'ai-career-' + state.result.id + '.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);

    btn.disabled = false;
    toast('画像を保存しました');
  });

  /* ─────────────────────────────────────────────
     16. テーマ切り替え
     ───────────────────────────────────────────── */
  (function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem('aidx-theme'); } catch (e) {}

    var prefersDark = window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches;

    var theme = saved || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', theme);

    el.themeToggle.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('aidx-theme', next); } catch (e) {}
    });
  })();

})();
