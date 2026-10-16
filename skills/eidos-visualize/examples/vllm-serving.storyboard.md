# vllm-serving.storyboard.md

질문(원문): "Iteration / context requests / context tokens / generation requests / decode, prefill / batch size / long-prefill-token-threshold / max-num-seqs / kvcache / 동시사용자, token per sec, end to end response time / vllm, model 사용할건데 이 개념들 모르겠다 / 시각화해서 보여줄래?"

의도: 여러 개념 묶음 + 시스템 동역학 (decision-table "여러 개념 묶음 / 시스템 동역학" 행) + trade-off(동시 사용자 ↔ tok/s ↔ E2E).
모든 그림은 vLLM V1 스케줄러를 단순화한 **개념도**이고, 숫자(슬롯 4, 예산 16, 블록 40, K=32)는 설명용 값이다. 사실 확인: docs.vllm.ai (configuration/optimization, design/metrics, api/vllm/config/scheduler).

structure: hub-and-spoke (hub: map; spokes: iteration, prefill, kvcache; 그 뒤 lab(컨트롤) → outro)

장면 목록
- map — 지도: 사용자 → 스케줄러 → GPU(↔ KV cache) → 출력, 아래에 지표(TTFT/ITL/E2E/tok/s) 띠
- iteration — 갈래 1 (스케줄러 노드): iteration, batch size, max_num_seqs, continuous batching, context/generation 요청
- prefill — 갈래 2 (GPU 노드): prefill/TTFT, decode/ITL/E2E, max_num_batched_tokens, chunked prefill, long_prefill_token_threshold
- kvcache — 갈래 3 (KV cache 노드): 블록 누적, 가득 참 → 대기/preempt, 반환
- lab — 컨트롤: max_num_seqs와 동시 사용자 슬라이더 → 처리량(tok/s) 바늘과 E2E 바늘
- outro — 용어 정리와 한 문장 결론

## concept

| concept | object | motion | meaning |
| --- | --- | --- | --- |
| 지도: 요청이 지나는 길 | 노드 카드 5개(사용자, 스케줄러, GPU, KV cache, 출력)와 연결선 4개 | 카드가 흐름 순서대로 0.92→1로 커지며 자리 잡고, 연결선이 왼쪽에서 오른쪽으로 그어짐(GPU↔KV는 양방향) | 요청은 사용자→스케줄러→GPU→출력 순서로 지나가고 GPU는 KV cache를 읽고 쓴다 |
| 응답 시간 분해 (TTFT/ITL/E2E) | 요청 점, 지표 띠의 TTFT 막대·ITL 눈금·E2E 막대 | 점이 연결선을 따라 사용자→스케줄러→GPU→출력으로 이동하는 동안 TTFT 막대는 점이 GPU를 떠날 때까지 차고 ITL 눈금이 GPU 구간에 찍히며 E2E 막대는 출력 도착까지 찬다 | E2E = 대기 + prefill + decode 이고 TTFT는 그 앞부분, ITL은 decode 구간의 간격이다 |
| iteration / batch size | 대기열의 요청 칩 6개, 배치 슬롯 4칸, iteration 카운터, batch size 숫자 | 칩 R1~R3가 대기열에서 슬롯 1~3으로 미끄러져 들어가고 batch size 숫자가 0→3으로 센다 | iteration마다 배치가 만들어지고 batch size는 그 iteration에 들어간 요청 수다 |
| max_num_seqs | iteration 카운터 "#n", 슬롯 오른쪽 토큰 점, 상한선 | 카운터가 #1→#4로 넘어갈 때마다 모든 슬롯 오른쪽에 토큰 점이 하나씩 늘고, #2에서 R4가 4번째 슬롯에 들어가며 "max_num_seqs=4" 상한선이 빨갛게 그어진다 | 한 iteration = 모든 활성 요청이 토큰 하나씩 전진; 동시에 돌 수 있는 요청 수의 상한이 max_num_seqs |
| continuous batching / waiting | 끝난 칩 R1, 다음 칩 R5, waiting 숫자 | R1이 오른쪽(완료)으로 빠지는 같은 iteration에 R5가 그 슬롯으로 들어오고 waiting 숫자가 2→1로 준다 | 슬롯은 비는 순간 채워진다; 못 들어간 요청은 waiting 큐에서 기다린다(num_requests_waiting) |
| context 요청 / generation 요청 | 슬롯 태그 4개, R5의 프롬프트 슬랩, 집계 숫자 | 새로 들어온 R5에 "prefill" 태그와 두꺼운 프롬프트 토큰 슬랩이 붙고 나머지 셋에는 "decode" 태그가 붙으며 완료 열 아래에 집계 "context=prefill 1 / generation=decode 3"이 뜬다 | 같은 배치 안에서도 요청은 prefill(context, 프롬프트 토큰 처리) 단계와 decode(generation, 토큰 생성) 단계로 나뉜다 |
| prefill / TTFT | 프롬프트 토큰 12칸, 첫 출력 토큰, TTFT 괄호 | 12칸이 왼쪽에서 오른쪽으로 한 번의 스윕으로 켜지고 첫 토큰이 튀어나오며 괄호가 도착 시점부터 첫 토큰까지 그어진다 | prefill은 프롬프트 전체를 한 번에 처리하는 큰 연산 한 번이고 그 끝이 TTFT다 |
| decode / ITL / E2E | 출력 토큰 8개, ITL 괄호, E2E 괄호 | 토큰이 tick마다 하나씩 떨어지고 두 토큰 사이에 ITL 괄호가 생기며 E2E 괄호가 마지막 토큰까지 늘어난다 | decode는 토큰당 iteration 한 번이라 출력 길이만큼 시간이 쌓인다 |
| max_num_batched_tokens | 예산 막대 16칸, 칸 라벨 | decode 칸 4개(활성 요청당 1개)가 먼저 차고 남은 12칸을 prefill 칸이 채워 막대가 가득 찬다 | iteration마다 토큰 예산이 있고 decode가 우선, prefill은 남는 몫을 받는다 |
| chunked prefill | 긴 프롬프트 슬랩 24칸, iteration 카운터 | 슬랩이 12칸씩 두 조각으로 잘려 #1, #2 두 iteration에 걸쳐 막대의 남는 자리로 들어간다 | 예산보다 긴 프롬프트는 잘려서 여러 iteration에 나눠 들어가므로 decode를 막지 않는다 |
| long_prefill_token_threshold | threshold 눈금(6), 긴 슬랩 조각, 짧은 프롬프트 4칸 | 눈금 6이 생기자 긴 슬랩 조각이 6칸으로 줄고 비어난 칸에 짧은 프롬프트 4칸이 같은 iteration에 들어가 첫 토큰을 낸다 | 임계를 넘는 긴 요청의 한 번 몫을 줄여 짧은 요청이 먼저 지나가게 한다(기본 0 = 끔) |
| KV cache 블록 누적 | 블록 격자 40칸(블록=16토큰), 사용률 게이지, 요청 A~D | A의 프롬프트 블록이 슬랩으로 한 번에 켜지고 이어서 16토큰마다 하나씩 더해지며, B·C·D가 번갈아 흩어진 칸을 채워 게이지가 0→95%로 오른다 | KV는 컨텍스트 길이(프롬프트 + 생성분)에 비례해 자라고 동시 요청 수만큼 빨리 찬다; 페이지 단위라 흩어져도 된다 |
| KV 가득 참 / preempt | 요청 E 칩, waiting 배지, D의 블록 | E가 격자에 닿았다가 튕겨 돌아와 반투명해지고 waiting 배지가 +1, 이어서 D의 블록이 깜빡인 뒤 비워져(preempt) C가 그 칸을 쓴다 | KV가 차면 새 요청은 기다리고 부족하면 실행 중 요청을 preempt(V1 기본 RECOMPUTE)한다 |
| KV 반환 | A의 블록, 게이지, 대기 칩 | A가 끝나며 블록이 비고 대기하던 요청이 그 칸을 채워 게이지가 내려갔다 다시 오른다 | 블록은 돌고 돌며, KV 용량이 동시성의 진짜 상한을 정한다 |
| 처리량 포화 (배치 크기) | 처리량 바늘, 슬롯 격자 256칸, 읽기값 | max_num_seqs가 1→128로 돌아가는 동안 슬롯 칸이 채워지고 처리량 바늘이 급히 오르다 완만해진다 | 배치가 커질수록 iteration당 토큰은 늘지만 iteration이 느려져 처리량은 포화한다 |
| 대기열과 E2E (동시 사용자) | E2E 바늘, 대기 칸(주황), 읽기값 | 동시 사용자가 8→128로 오르면 32를 넘는 칸이 주황(대기)으로 바뀌고 E2E 바늘이 빨간 영역으로 꺾인다 | 용량(max_num_seqs)을 넘는 사용자는 기다리므로 E2E가 급히 는다; 처리량은 더 늘지 않는다 |
| 정리 | 용어 5줄, 결론 문장의 핵심어 | 줄이 순서대로 들어오고 결론의 "배치"와 "대기열"에 하이라이트가 지나간다 | 묻던 용어들이 그림의 각 부분에 대응하고, 처리량은 배치가 응답 시간은 대기열이 정한다 |

## boundary

| boundary | via | reason |
| --- | --- | --- |
| map → iteration | camera | 지도 속 부분(스케줄러 노드)으로 들어감 |
| iteration → map | camera | 다시 전체 맥락(지도)으로 나옴 |
| map → prefill | iris | 출발한 요소(GPU 노드)가 중요함: 그 노드를 중심으로 나머지를 닫고 안으로 들어감 |
| prefill → map | camera | 다시 전체 맥락(지도)으로 나옴 |
| map → kvcache | camera | 지도 속 부분(KV cache 노드)으로 들어감 |
| kvcache → map | camera | 다시 전체 맥락(지도)으로 나옴 |
| map → lab | match-cut | 모양이 서로 대응함: 지도의 작은 처리량 게이지가 실험실의 큰 처리량 게이지로 이어짐 |
| lab → outro | dip-to-color | 장이 바뀜: 실험에서 정리로 |

distinct via: 4 (camera, iris, match-cut, dip-to-color)

via 순서: camera, camera, iris, camera, camera, camera, match-cut, dip-to-color (같은 값 최대 3연속, iris·match-cut·dip-to-color 각 1회).

## control

| control | type/range | on-screen effect |
| --- | --- | --- |
| max-num-seqs | range 1-256 (기본 32) | 활성 칸 수 = min(동시 사용자, max_num_seqs)가 바뀌어 슬롯 격자, 처리량 바늘, E2E 바늘, 읽기값이 함께 움직임 |
| users (동시 사용자) | range 1-256 (기본 64) | 대기 칸 수 = max(0, 동시 사용자 − max_num_seqs)가 바뀌어 주황 칸, E2E 바늘, 처리량 바늘, 읽기값이 함께 움직임 |

단순 모델(개념도, 화면에 그대로 적음): active = min(사용자, max_num_seqs); iteration 시간 ∝ 1 + active/32; 처리량 ∝ active / iteration 시간; 대기 = max(0, 사용자 − max_num_seqs); E2E ∝ (1 + 대기/max_num_seqs) × iteration 시간. 두 컨트롤은 lab 장면에서만 보인다(`when: "lab"`).

## stops (캡션)

| scene.stop | concept 행 | caption |
| --- | --- | --- |
| map.1 | 지도: 요청이 지나는 길 | 요청은 사용자 → 스케줄러 → GPU → 출력 순으로 지나갑니다 |
| map.2 | 응답 시간 분해 | 한 요청의 시간: 대기 + prefill(TTFT) + decode = E2E |
| iteration.0 | iteration / batch size | 대기열의 요청이 iteration의 빈 슬롯으로 들어갑니다 |
| iteration.1 | max_num_seqs | iteration마다 모든 슬롯이 토큰 하나씩, 슬롯 상한이 max_num_seqs |
| iteration.2 | continuous batching / waiting | 끝난 자리는 즉시 다음 요청이 채웁니다 (continuous batching) |
| iteration.3 | context 요청 / generation 요청 | 한 배치 안에 prefill(context) 요청과 decode(generation) 요청이 섞입니다 |
| map.ret-iteration | (복귀) | 다시 지도 — 다음은 GPU 안의 prefill과 decode |
| prefill.0 | prefill / TTFT | prefill: 프롬프트 토큰 전부를 한 번에 → 첫 토큰까지가 TTFT |
| prefill.1 | decode / ITL / E2E | decode: iteration마다 토큰 하나씩 → 간격이 ITL, 끝까지가 E2E |
| prefill.2 | max_num_batched_tokens | iteration의 토큰 예산 max_num_batched_tokens: decode 먼저, 남는 칸에 prefill |
| prefill.3 | chunked prefill | 예산보다 긴 프롬프트는 잘라서 여러 iteration에 나눕니다 (chunked prefill) |
| prefill.4 | long_prefill_token_threshold | long_prefill_token_threshold: 긴 프롬프트의 한 번 몫을 줄여 짧은 요청을 먼저 보냅니다 |
| map.ret-prefill | (복귀) | 다시 지도 — 다음은 토큰이 남기는 KV cache |
| kvcache.0 | KV cache 블록 누적 | 토큰의 K/V는 16토큰 블록으로 쌓이고, 동시 요청이 많을수록 빨리 찹니다 |
| kvcache.1 | KV 가득 참 / preempt | 블록이 다 차면 새 요청은 대기하고, 모자라면 실행 중 요청을 preempt합니다 |
| kvcache.2 | KV 반환 | 요청이 끝나면 블록을 돌려줍니다 — KV 용량이 동시성의 진짜 상한입니다 |
| map.ret-kvcache | (복귀) | 다시 지도 — 이제 숫자를 직접 움직여 봅니다 |
| lab.0 | 처리량 포화 | max_num_seqs를 키우면 처리량은 오르다 포화하고 iteration은 조금 느려집니다 |
| lab.1 | 대기열과 E2E | 동시 사용자가 max_num_seqs를 넘으면 대기열이 생겨 E2E가 급히 늘어납니다 |
| lab.2 | (컨트롤 안내) | 직접 움직여 보세요: 처리량과 E2E는 서로 당깁니다 (단순 모델) |
| outro.0 | 정리 | 용어 정리: 묻던 단어가 그림의 어느 부분인지 |
| outro.1 | 정리 | 결론: 처리량은 배치가, 응답 시간은 대기열이 정합니다 |

## 사실 확인 메모 (docs.vllm.ai)

- `max_num_seqs`: 한 iteration에 처리하는 시퀀스(요청) 수의 최대. `max_num_batched_tokens`: 한 iteration에 처리하는 토큰 수의 최대 (api/vllm/config/scheduler).
- chunked prefill은 V1에서 기본 켜짐. decode 요청을 먼저 배치하고 남는 `max_num_batched_tokens` 예산에 prefill을 넣으며, 안 들어가면 자동으로 잘라 넣는다. 예산이 작으면 ITL이 좋아지고 크면 TTFT가 좋아진다 (configuration/optimization).
- `long_prefill_token_threshold`: 프롬프트가 이 토큰 수보다 길면 "긴" 요청. 기본 0(끔). 설정하면 스케줄러가 한 step에 그 요청에 주는 토큰을 임계값으로 자른다(`num_new_tokens = min(num_new_tokens, threshold)`); `max_long_partial_prefills`를 낮추면 짧은 프롬프트가 먼저 지나간다 (api/vllm/config/scheduler, v1/core/sched/scheduler.py).
- KV cache: `block_size` 16, `gpu_memory_utilization` 0.9가 KV 영역을 미리 잡는다. 공간이 부족하면 preempt하고 나중에 재계산(V1 기본 RECOMPUTE). 대책: gpu_memory_utilization 올리기, max_num_seqs/max_num_batched_tokens 낮추기, TP/PP (configuration/optimization, design/metrics의 cache_config_info).
- 지표: TTFT(`vllm:time_to_first_token_seconds`), ITL(`vllm:inter_token_latency_seconds`, 연속 출력 사이 간격), TPOT(`(E2E − TTFT)/(출력 토큰 − 1)`), E2E(`vllm:e2e_request_latency_seconds`, 도착→마지막 토큰), 대기 시간(`vllm:request_queue_time_seconds`), 실행/대기 요청 수(`vllm:num_requests_running/_waiting`), 프롬프트/생성 토큰(`vllm:prompt_tokens_total`, `vllm:generation_tokens_total`), KV 사용률(`vllm:kv_cache_usage_perc`) (design/metrics).
- "context 요청/토큰"은 prefill(프롬프트) 단계, "generation 요청/토큰"은 decode 단계를 가리키는 말로 쓰고, vLLM 지표 이름(prompt/generation)을 함께 적는다.

## self-review

검토 기록: 1회차는 contact sheet(1280×800), 390×844 스크린샷(HUD 켜고), 갈래 스톱마다 SVG 텍스트 bbox 측정(잘림·겹침)으로 보고 아래 `fix` 칸의 문제를 고쳤다. 2회차 contact sheet에서는 모든 스톱이 concept 표의 행으로 거슬러 가고, 텍스트 측정은 두 폭 모두 0건이다. `bun scripts/qa.mjs skills/eidos-visualize/examples/vllm-serving.html --contact <dir> --stop-diff`: PASS, DETERMINISM 1/1, REDUCED 1/1, 같은 장면 인접 스톱 14쌍 모두 changed > 0. 컨트롤: `?c.max-num-seqs=1`과 `=256`, `?c.users=1`과 `=256`이 lab.0/lab.2/outro.1에서 서로 다른 스냅샷을 주고, 각각 페이지 안 `setControls`와 같다.

| stop | moves | explains | fix |
| --- | --- | --- | --- |
| 0 (map, t=0) | 제목·부제만 보이고 파이프라인은 아직 없음 (intro가 바로 1로 감) | 무엇에 대한 설명인지 | - |
| map.1 | 노드 카드 5개가 흐름 순서로 자리 잡고 연결선 5개(GPU↔KV 왕복 포함)가 그어진 뒤 지표 띠가 올라옴 | 요청이 지나는 길 | 1회차: 스케줄러 카드 4번째 슬롯에 tween이 없는 토큰 점 2개가 항상 보임 → 만들지 않도록 고침 |
| map.2 | 요청 점이 연결선을 따라 사용자→스케줄러→GPU(머물며 커짐)→출력으로 이동, TTFT 막대·ITL 눈금·E2E 막대·tok/s 바늘이 함께 참 | E2E = 대기 + prefill + decode, TTFT는 앞부분 | - |
| iteration.0 | 카메라가 스케줄러 카드로 들어가고 R1~R3이 슬롯으로, 대기열이 당겨지고 waiting 6→3, batch size 0→3, iteration #1 | iteration마다 배치가 만들어지고 batch size는 그 안의 요청 수 | - |
| iteration.1 | #1→#4로 넘어갈 때마다 슬롯마다 토큰 점이 하나씩, #2에 R4가 4번째 슬롯으로, max_num_seqs = 4 상한선 | 한 iteration = 모든 활성 요청이 토큰 하나씩, 상한은 max_num_seqs | - |
| iteration.2 | R1이 완료 열로 빠지고(점 사라짐) 같은 구간에 R5가 그 슬롯으로, waiting 2→1, #5 | continuous batching, waiting 큐 | - |
| iteration.3 | R5에 prefill 태그와 프롬프트 슬랩, 나머지에 decode 태그, 완료 열 아래 집계 두 줄 | context(prefill) 요청과 generation(decode) 요청이 한 배치에 섞임 | 1회차: 집계 텍스트가 완료 열의 R1 칩과 겹침 → 오른쪽 정렬로 R1 아래(y 84/95)로 옮기고 문구 단축 |
| map.ret-iteration | 갈래에서 바꾼 것(칩 위치, 점, 태그, 숫자)이 모두 되돌아가고 카메라가 지도로 빠짐 | 다시 전체 맥락 | - |
| prefill.0 | iris가 GPU 노드를 중심으로 나머지를 닫고 카메라가 들어감, 프롬프트 12칸이 스윅으로 켜지고 첫 토큰, TTFT 괄호 | prefill 한 번 = TTFT | - |
| prefill.1 | 출력 토큰 7개가 tick마다 하나씩, ITL 괄호, E2E 괄호 | decode는 토큰당 iteration, 출력 길이만큼 시간 | - |
| prefill.2 | 예산 막대 라벨과 카운터, decode 칸 4개 → prefill 칸 12개 순으로 참 | max_num_batched_tokens, decode 우선 | - |
| prefill.3 | 24칸 슬랩이 나타나고 12칸씩 #2, #3 두 iteration에 걸쳐 막대로 들어감 | chunked prefill | - |
| prefill.4 | 슬랩 리셋, 짧은 4칸 등장, threshold 눈금 6이 그어지고 긴 조각 6칸 + 짧은 4칸이 같은 iteration에 들어가 짧은 요청의 첫 토큰 | long_prefill_token_threshold | 1회차: `iteration #2 (threshold 적용)`이 예산 라벨과 겹침 → 라벨 단축("토큰 예산 max_num_batched_tokens = 16"), 카운터 "(threshold)" |
| map.ret-prefill | 되돌림 + iris가 가린 지도 형제 요소 복원 + 카메라 아웃 | 다시 전체 맥락 | - |
| kvcache.0 | 카메라 인, A 슬랩 4칸 → 16토큰마다 1칸, B·C·D가 번갈아 흩어진 칸, 게이지 0→95% | KV는 컨텍스트 길이에 비례, 동시 요청만큼 빨리 참, 페이지 단위 | - |
| kvcache.1 | E가 격자에 닿았다 튕겨 반투명(waiting 1), A·B가 마지막 두 칸(100%), D 블록이 깜빡이며 비워짐(preempt, waiting 2, 80%), C가 그 칸(83%) | 가득 차면 대기, 모자라면 preempt | 1회차: "D preempt → 나중에 재계산"이 viewBox 밖으로 잘리고 E 칩이 waiting 배지 글자를 덮음 → 문구 단축, E는 자리 이동 대신 반투명 처리 |
| kvcache.2 | A 완료(칩 퇴장, 블록 13개 소멸, 50%), E가 A 자리로 들어가 블록 0~3 재색(60%), D 복귀 재prefill(68%), 힌트 | 블록은 돌고 돌며 KV 용량이 동시성 상한 | - |
| map.ret-kvcache | 되돌림 + 카메라 아웃 | 다시 전체 맥락 | - |
| lab.0 | match-cut: 지표 띠의 작은 tok/s 게이지가 큰 게이지로 날아가고, 사용자 128 고정에서 max_num_seqs 1→128 drive: 활성 칸이 차며 처리량 바늘이 급히 오르다 완만, E2E 바늘은 대기 소멸로 내려옴 | 배치가 클수록 처리량 포화 | 1회차: match-cut 대상이 SVG라 조상 translate 도중에 측정되어 결정성이 깨짐 → HTML 박스(#g-tp-mini/#g-tp-big)로 감쌈. 데스크톱에서 컨트롤 독이 슬롯 격자를 덮음 → 격자를 열 왼쪽 정렬 |
| lab.1 | max 32에서 사용자 8→128 drive: 32 넘는 칸이 주황(대기), E2E 바늘이 빨간 영역으로 | 용량 넘는 사용자는 대기, E2E 급증 | - |
| lab.2 | 사용자 128→64, "서로 당깁니다" 하이라이트; 슬라이더가 활성 | 독자가 직접 trade-off 확인 | 1회차: 모바일에서 공식 블록과 결론 문장이 독 아래로 숨음 → 모바일 전용 축약(부제 숨김, 격자 18vh, 주석 숨김), lab-grid의 flex-grow 제거 |
| outro.0 | dip-to-color "정리" 뒤 용어 5줄이 순서대로 | 묻던 단어가 그림의 어느 부분인지 | - |
| outro.1 | 결론 문장이 올라오고 "배치"·"대기열"에 띠, "max_num_seqs와 토큰 예산"에 원 | 한 문장 결론 | - |

알려진 한계: 390px 폭에서는 갈래 카드가 카메라로 약 2배까지만 커지므로(카드 폭 ≈ 뷰포트 폭) 카드 안 세부 라벨은 약 8px다. 겹침·잘림은 없고(텍스트 bbox 측정 0건) 제목·칩·숫자는 읽히며, 세부 라벨은 데스크톱 기준이다.
