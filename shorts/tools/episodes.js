// 장면(beat) 정의
// big: 큰 글씨([강조]), sub: 작은 설명, chat: 말풍선, dia: 움직이는 도식, img: 일러스트(배경 전체)
// fx: 'punch'(줌 펀치) | 'shake'(흔들기)
module.exports = [
  {
    id: 'EP1', series: '내향인 대화법 1편',
    beats: [
      { img: 'ep1_outside', fx: 'punch', kicker: '대화에 못 끼고 서 있는 내향인', big: '웃어주기만 하면\n그 원은\n[영영 안 열려요]', dur: 3.4 },
      { img: 'ep1_outside', pan: 'left', big: '셋이 얘기하는데\n[아무도] 안 돌아봐요', dur: 2.6 },
      { dia: 'ringClosed', big: '사람은\n말하는 사람 쪽으로\n[몸을 돌려요]' },
      { dia: 'ringClosed', big: '그래서 원이\n[저절로] 닫혀요', sub: '일부러 막은 사람은 없어요' },
      { chat: [{ s: 'R', t: '하하…' }], big: '그래서 뒤에서\n타이밍 맞춰 웃어요', sub: '근데 아무도 안 돌아봐요' },
      { fx: 'shake', big: '웃어주는 걸로는\n[안 열려요]', dur: 2.0 },
      { dia: 'ringGap', big: '틈으로 [반 발짝]\n들어가서 물어보세요' },
      { img: 'ep1_inside', fx: 'punch', big: '"잠깐, 그래서\n[어떻게 됐어요?]"', dur: 2.8 },
      { dia: 'ringOpen', big: '사람들은\n[질문한 사람]\n쪽으로 돌아요' },
      { img: 'ep1_inside', pan: 'right', big: '그때 원이\n[열려요]', dur: 2.4 },
      { cta: true, big: '다음 회식 전에\n[저장]해두세요', sub: '원 밖에서 기다리는 편이에요,\n들어가는 편이에요?', dur: 3.2 },
    ],
  },
  {
    id: 'EP2', series: '내향인 대화법 2편',
    beats: [
      { img: 'ep2_rehearse', fx: 'punch', kicker: '자기소개만 하면 이름이 묻히는 사람', big: '이름을 [먼저] 말해서\n까먹히는 거예요', dur: 3.4 },
      { chat: [{ s: 'R', t: '안녕하세요, 두잉영이에요.' }, { s: 'L', t: '아 네, 저는 민지예요.' }], big: '송년회,\n처음 보는 사람' },
      { img: 'ep2_forget', fx: 'shake', big: '5분 뒤\n"죄송한데…\n[성함이?]"', dur: 2.6 },
      { fx: 'punch', kicker: '심리학', big: '[차례 직전 효과]', sub: 'Next-in-line effect', dur: 2.4 },
      { big: '내 차례 직전에\n나온 말은\n[기억을 잘 못 해요]' },
      { img: 'ep2_rehearse', pan: 'left', big: '할 말을 준비하느라\n[바쁘거든요]', dur: 2.6 },
      { big: '내가 먼저 말하면\n내 이름은 [흘려들어요]' },
      { chat: [{ s: 'R', t: '처음 뵙는 것 같아요!' }, { s: 'L', t: '아, 민지예요.' }, { s: 'R', t: '민지 님! 저는 두잉영이에요.' }], big: '상대가 [먼저]\n말하게 하세요', dur: 3.6 },
      { big: '상대 말이 끝나야\n내 이름이\n[들어갈 자리]가 생겨요' },
      { img: 'ep2_remember', fx: 'punch', big: '[두 번째로] 말하면\n기억에 남아요', dur: 2.6 },
      { cta: true, big: '송년회 전에\n[저장]해두세요', sub: '이름을 까먹는 쪽이에요,\n까먹히는 쪽이에요?', dur: 3.2 },
    ],
  },
  {
    id: 'EP3', series: '내향인 대화법 3편',
    beats: [
      { img: 'ep3_lean', fx: 'punch', kicker: '회식만 가면 끝자리인 사람', big: '몸을 기울일수록\n[더 소외돼요]', dur: 3.4 },
      { img: 'ep3_lean', pan: 'right', big: '끝자리에서 늘\n[1초 늦게] 웃으세요?', dur: 2.6 },
      { chat: [{ s: 'L', t: '…그래서 김 대리가…' }, { s: 'R', t: '(김 대리가 누구였지…?)', think: true }], big: '기울여도\n[반만] 들려요' },
      { fx: 'punch', kicker: '실제 대화를 관찰한 연구', big: '대화 하나에\n끼는 사람은\n[4명 정도]가 최대' },
      { dia: 'tableSplit', big: '그보다 많으면\n대화가 [둘로] 갈라져요' },
      { dia: 'tableSplit', big: '8명 테이블은\n[대화가 두 개]', sub: '나는 먼 쪽 대화의 가장자리' },
      { dia: 'tableMine', big: '기울이지 말고\n[옆 세 명]이랑\n시작하세요' },
      { fx: 'punch', big: '"올해 제일\n[황당했던 일]\n뭐였어요?"', dur: 2.6 },
      { img: 'ep3_loud', pan: 'left', big: '이번엔 우리 쪽이\n[시끄러운 쪽]', dur: 2.8 },
      { cta: true, big: '송년회 전에\n[저장]해두세요', sub: '회식에서 주로\n어느 자리에 앉으세요?', dur: 3.2 },
    ],
  },
  {
    id: 'EP4', series: '내향인 대화법 4편',
    beats: [
      { img: 'ep4_silence', fx: 'punch', kicker: '대화가 자꾸 끊기는 내향인', big: '"오 좋네요"가\n[대화를 끝내요]', dur: 3.4 },
      { chat: [{ s: 'L', t: '주말에 등산 다녀왔어요.' }, { s: 'R', t: '오 좋네요.' }, { s: 'L', t: '……', think: true }], big: '월요일 엘리베이터', dur: 3.0 },
      { fx: 'punch', big: '대신 쓸 문장\n[4개]', dur: 1.8 },
      { num: '1', img: 'ep4_story', big: '[더 얘기해 주세요.]', sub: '이야기를 꺼내면 판을 넘겨주세요', dur: 2.8 },
      { num: '1', big: '자기 얘기를 할 때\n뇌는 [맛있는 걸\n먹을 때]처럼 반응해요' },
      { num: '2', chat: [{ s: 'R', t: '빵집 어땠어요?' }, { s: 'L', t: '괜찮았어요.' }], big: '"어땠어요?"는\n[점수]만 듣고 끝나요' },
      { num: '2', fx: 'punch', big: '[가보니까\n어떤 느낌이었어요?]', sub: '그때를 다시 떠올리게 하세요' },
      { num: '3', fx: 'punch', big: '[어쩌다\n시작하게 됐어요?]', sub: '이유를 물으면 이야기가 따라 나와요' },
      { num: '4', chat: [{ s: 'L', t: '이직할까 고민 중이에요.' }, { s: 'R', t: '무조건 하세요!' }, { s: 'L', t: '…그쵸.' }], big: '바로 조언하면\n[대화가 닫혀요]', fx: 'shake' },
      { num: '4', img: 'ep4_listen', big: '[요즘 마음은\n어느 쪽이에요?]', dur: 2.8 },
      { list: ['더 얘기해 주세요', '가보니까 어땠어요?', '어쩌다 시작했어요?', '요즘 마음은 어느 쪽이에요?'], big: '네 문장만\n[갖고 다니세요]', dur: 3.8 },
      { cta: true, big: '[저장]하고 월요일에\n하나만 써보기', sub: '써보고 어땠는지\n댓글로 알려주세요', dur: 3.2 },
    ],
  },
];
