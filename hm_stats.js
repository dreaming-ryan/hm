/**
 * hm_stats.js — hm_quiz.html의 QUESTIONS 배열을 파싱하여
 * 회차·과목별 통계와 문제 원본 배열을 콜백으로 반환합니다.
 *
 * 위험물산업기사 분류 체계:
 *   - round: "16-1", "16-2", ..., "20-2" (연-회차)
 *   - subject: 1, 2, 3 (1과목=일반화학, 2과목=화재예방과 소화방법, 3과목=위험물의 성질과 취급)
 */
(function () {
  'use strict';

  // 과목 번호 → 과목명
  var SUBJECT_NAMES = {
    1: '일반화학',
    2: '화재예방과 소화방법',
    3: '위험물의 성질과 취급'
  };

  // 회차 → "20년 2회" 같은 표시 라벨
  function formatRoundLabel(round) {
    var parts = String(round).split('-');
    if (parts.length !== 2) return round + '';
    return '20' + parts[0] + '년 ' + parts[1] + '회';
  }

  // 회차 → 정수 키 (16-1 → 161, 20-2 → 202) — 정렬 용도
  function roundKey(round) {
    var parts = String(round).split('-');
    if (parts.length !== 2) return 0;
    return parseInt(parts[0], 10) * 10 + parseInt(parts[1], 10);
  }

  function loadStats(callback) {
    fetch('hm_quiz.html')
      .then(function (r) { return r.text(); })
      .then(function (html) {
        // QUESTIONS = [ ... ]; 추출
        var arrMatch = html.match(/const\s+QUESTIONS\s*=\s*(\[[\s\S]*?\n\s*\])\s*;/);
        if (!arrMatch) {
          console.error('hm_stats.js: QUESTIONS 배열 추출 실패');
          return;
        }

        var questions;
        try {
          questions = (new Function('return ' + arrMatch[1]))();
        } catch (e) {
          console.error('hm_stats.js: QUESTIONS 파싱 오류', e);
          return;
        }

        var totalQ = questions.length;
        var roundMap = {};
        var subjectMap = {};
        var roundSet = new Set();
        var subjectSet = new Set();
        // 회차+과목 교차 통계 {round}_{subject}
        var roundSubjectMap = {};

        questions.forEach(function (q) {
          roundSet.add(q.round);
          subjectSet.add(q.subject);
          roundMap[q.round] = (roundMap[q.round] || 0) + 1;
          subjectMap[q.subject] = (subjectMap[q.subject] || 0) + 1;
          var key = q.round + '_' + q.subject;
          roundSubjectMap[key] = (roundSubjectMap[key] || 0) + 1;
        });

        // 회차 정렬 (오래된 것 → 최신)
        var rounds = Array.from(roundSet).sort(function (a, b) {
          return roundKey(a) - roundKey(b);
        });
        var subjects = Array.from(subjectSet).sort(function (a, b) { return a - b; });
        var totalRounds = rounds.length;

        // 연도 범위 (16~20)
        var years = rounds.map(function (r) { return parseInt(r.split('-')[0], 10); });
        var minYear = Math.min.apply(null, years);
        var maxYear = Math.max.apply(null, years);

        callback({
          totalQ: totalQ,
          totalRounds: totalRounds,
          rounds: rounds,
          subjects: subjects,
          roundMap: roundMap,
          subjectMap: subjectMap,
          roundSubjectMap: roundSubjectMap,
          subjectNames: SUBJECT_NAMES,
          questions: questions,
          minYear: minYear,
          maxYear: maxYear,
          formatRoundLabel: formatRoundLabel,
          roundKey: roundKey
        });
      })
      .catch(function (err) {
        console.error('hm_stats.js fetch 오류:', err);
      });
  }

  window.HmStats = {
    load: loadStats,
    SUBJECT_NAMES: SUBJECT_NAMES,
    formatRoundLabel: formatRoundLabel,
    roundKey: roundKey
  };
})();
