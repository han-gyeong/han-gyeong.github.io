---
title: ""
date: YYYY-MM-DD HH:MM:SS +0900
categories: []
tags: []
summary: ""
---

# Kafka
## 브로커
프로듀서가 발행한 데이터를 안전하게 저장하여 사용할 수 있게 하는 프로세스

### 컨트롤러
클러스터 중 하나의 브로커가 컨트롤러 역할을 맡아서, 다른 브로커들의 상태를 체크한다.  
만약 다른 브로커가 죽게 된다면 해당 브로커가 담당하던 리더 파티션을 다른 브로커에 재분배한다.  
컨트롤러 역할을 하는 브로커에 장애가 생기면 다른 브로커가 컨트롤러 역할을 한다.  

### 데이터 삭제
카프카는 컨슈머가 데이터를 가져가도 토픽의 데이터는 삭제되지 않는다.  
브로커만이 삭제가 가능하며, 파일 단위로 지우는데 이 단위를 '로그 세그먼트' 라고 부른다.  

### 컨슈머 오프셋 저장
컨슈머가 어디까지 읽었는지를 의미하는 오프셋을 관리한다. __consumer_offsets 토픽에 저장된다.

### 그룹 코디네이터
컨슈머 그룹의 상태를 체크하고 파티션과 컨슈머를 매칭되도록 분배하는 역할을 한다.  
컨슈머가 컨슈머 그룹에서 빠지면 매칭되지 않은 파티션을 정상 컨슈머로 재할당해 데이터가 처리되도록 하는데, 이 과정을 리밸런스라고 부른다.

### 데이터 저장
카프카를 실행할 때 설정 파일에 정의 된 디렉토리에 데이터를 저장한다.  
토픽 이름과 파티션 번호(notification-topic-0) 와 같은 디렉토리 하위에 저장되며,  
log - 메시지/메타데이터, index - 메시지의 오프셋을 인덱싱 한 정보, timeindex - 메시지의 timestamp 기준 인덱싱 한 정보가 담겨있다.
> 실제로 Log 파일 말고는 cat이 되는 건 없는 것 같다.

한 파일에 지속적으로 데이먼트의 맨 첫 시작에 있는 오프셋 번호가 파일 명이 된다.  
가장 마지막의 세그먼트 파일 이름을 Active 세그먼트라고 하고, 액티브 세그먼트는 삭제 대상에 포함되지 않는다.  
액티브 세그먼트가 아닌 대상들은 retention 옵션에 따라 삭제 대상으로 설정된다.

#### 세그먼트와 삭제 주기
#### cleanup.policy=delete
- log.retention.hours : 세그먼트를 보유할 최대 기간, 기본 값은 7일이다.
- log.retention.bytes : 파티션 당 로그 적재 바이트 값, 기본 값은 비활성화 되어 있다.
- log.retention.check.interval.ms : 특정 주기마다 돌면서 삭제 대상을 식별하고 지우는 역할을 수행하는데, 그 주기를 지정한다.

파일(세그먼트) 단위로 삭제되기 때문에, 개별 레코드 단위로 삭제하기는 불가능하며 레코드 수정도 불가능하다.

#### cleanup.policy=compact
일반적으로 아는 압축과는 달리, 메시지 키 기준으로 최신의 데이터만 남기고 이전의 데이터는 모두 삭제하는 정책을 의미한다.
삭제 정책과 다르게 일부 레코드만 제거될 수 있고, 액티브 세그먼트를 제외한 데이터가 대상이다.

- 테일 영역 : 압축 정책에 의해 압축이 완료된 레코드들, 클린 로그라고도 부른다. => 압축이 완료되었으므로 중복 메시지 키가 없다. (압축이 완료된 구간)
- 헤드 영역 : 압축 정책이 되기 전 레코드들, 더티 로그라고도 부른다. => 압축 진행 이전이므로 중복된 메시지 키가 있다. (압축 이후 Append 된 구간)
  터가 저장되지 않고 여러 파일로 나뉘어 저장된다.  
세그먼트 크기를 바이트 단위(log.sement.bytes) 로 지정하거나, 파일 롤링 주기(log.roll.ms) 를 설정할 수 있다.  
파일 이름에 000000[숫자].log 처럼 되어 있는데, 세그
min.cleanable.dirty.ratio 라는 설정에 의해 압축 시작 시점을 결정하는데, 이 값은 전체 레코드 크기에서 더티 레코드 크기가 차지하는 비율을 의미한다.
- 0.5 => 더티 레코드 개수가 전체 레코드 중 절반
- 0.1 => 더티 레코드 개수가 전체의 10% 차지 시 수행 - 더티 레코드가 10% 일때마다 수행하므로 압축이 자주 일어남
- 0.9 => 더티 레코드 개수가 전체의 90% 차지 시 수행 - 더티 레코드가 90% 가 될때까지 용량이 사용됨

### 복제(Replication)
카프카를 고가용성으로 만드는 원동력, 클러스터의 일부 브로커가 장애가 발생하더라도 데이터를 유실하지 않고 사용하기 위함이다.  
데이터 복제는 파티션 단위로 이루어지고, 토픽을 생성할때 파티션 복제 개수(replication factor) 를 설정하는데, 미지정 시 브로커 옵션을 따라간다.  
복제 개수의 최솟값은 1(복제 없음) 이고, 최댓값은 브로커 개수만큼 설정하여 사용할 수 있다.  
(운영에서는 보통 2 - 3 정도 쓴다고 한다.)

복제된 파티션은 리더와 팔로워로 구성되며, 프로듀서/컨슈머와 직접 통신하는 파티션을 리더라고 한다.  
나머지 복제 데이터를 가지고 있는 파티션을 팔로워라고 하며, 리더의 오프셋을 확인해 자신의 오프셋과 비교한 후 차이가 날 때 리더로 부터 데이터를 가져와 저장하는 과정을 거친다.

브로커가 다운되면 해당 브로커에 있는 리더들은 사용할 수 없어, 팔로워 중 하나가 리더 지위를 넘겨받는다(승급이라고 한다).  

#### ISR
리더와 동일한 오프셋을 유지한 리더 + 팔로워들의 집합이다.  
unclean.leader.election.enable 값으로 ISR이 아닌 팔로워를 리더로 선출할지 설정할 수 있다.  
true면 유실을 감수해서 ISR 이 아닌 팔로워도 리더로 승급할 수 있으며, false 면 유실을 감수하지 않고 브로커가 복구될 때까지 중단된다.
> unclean.leader.election.enable 값은 토픽 단위로 설정할 수 있다.

### 토픽과 파티션
토픽은 1개 이상의 파티션으로 구성되어 있으며, 파티션 내부는 큐와 유사하게 구성되어 있다.  
FIFO 형식을 따르며, 컨슈머가 데이터를 가져가도 삭제되지 않아 여러 컨슈머 그룹들이 가져갈 수 있다.

토픽 생성 시 리더 파티션은 Round-Robin 형식으로 분배되어 브로커별로 트래픽을 균등하게 분배하도록 되어 있다.  
가끔 특정 프로커에 리더가 몰리는 경우가 있을 수 있는데, 이땐 kafka-reassign-partitions.sh 로 재분배를 할 수 있다.

파티션과 컨슈머는 1 대 1 로 매칭되며, 여러 컨슈머가 한 파티션을 담당할 순 없지만 한 컨슈머가 여러 파티션을 담당할 순 있다.
파티션 개수를 늘릴 순 있으나, 파티션 개수를 줄이거나 할 수는 없다.

### 레코드
레코드는 타임스탬프, 헤더, 메시지 키, 메시지 값, 오프셋으로 구성되어 있다.  
프로듀서에서 메세지를 브로커로 전송하면 오프셋과 타임스탬프(옵션에 따라) 가 지정되어 저장된다.

#### 타임스탬프
스트림 프로세싱에 활용하기 위한 시간이 저장되는 용도로 활용되며, 기본값으로 ProducerRecord의 생성시간이 들어간다.  
또는 브로커 적재 시간(LogAppendTime) 으로 설정할 수 있고, 옵션은 토픽 단위로 설정 가능하다.  

#### 오프셋
프로듀서가 생성한 레코드에는 존재하지 않으며, 브로커에 적재될 때 오프셋이 지정된다.

#### 헤더
Key, value 데이터를 추가할 수 있고, 레코드의 스키마 버전과 같이 프로세싱에 활용할 데이터를 넣을 수 있다.

#### 메시지 키
메시지 키는 메시지를 파티션에 따라 분류하기 위해 사용되며, 필수값은 아니고 미지정 시 null로 입력된다.  
메시지 키가 null 일 경우 Round-Robin에 따라 들어가며, null이 아닐경우 파티셔너의 해시값에 따라 특정 파티션에 매핑되어 전달된다.  

#### 메시지 값
실질적으로 처리할 데이터가 담기는 공간이며, 포맷은 제네릭으로 사용자에 의해 지정된다.  
Float, Byte[], String 등 다양한 형태로 지정 가능하며, 필요에 따라 직렬화/역직렬화 클래스를 만들어 활용할 수 있다.  
브로커에 저장된 메시지 값은 어떤 포맷으로 직렬화 되었는지 모르기 때문에, 컨슈머는 역직렬화 타입을 알고 있어야 한다.  

### 토픽
토픽명에 언더바와 점이 들어가면 내부적으로 오류가 발생할 수 있어 WARNING 메시지가 출력된다.  

보통 아래 템플릿에 따라 토픽명을 작명하고는 한다.
- <환경>.<팀-명>.<애플리케이션-명>.<메시지 타입>
  - prd.marketing-tem.sms-platform.json
- <프로젝트-명>.<서비스-명>.<환경>.<이벤트명>
  - commerce.payment.prd.notification
- <클러스터명>.<환경>.<서비스명>.<메시지 타입>

### 클라이언트 메타데이터
카프카 클라이언트는 리더 파티션의 위치를 알기 위해 데이터를 주고 받기전에 메타데이터를 브로커로 부터 전달받는다.  
메타데이터는 다음 옵션을 통해 리프레쉬된다.
- metadata.max.age.ms - 프로듀서/컨슈머가 클러스터 메타데이터를 강제로 갱신하는 최대 주기
- metadata.max.idle.ms - 해당 토픽에 일정 시간 동안 접근이 없으면 metadata 캐시를 버리는 시간

클라이언트가 리더 파티션을 가진 브로커가 아니라, 다른 브로커에 요청을 한 경우에는 LEADER_NOT_AVAILABLE 익셉션이 발생한다.  
이 에러가 자주 발생한다면, 메타데이터 리프래쉬 간격을 확인하고 클라이언트가 정상 메타데이터를 가지고 있는지 확인해야 한다.  

## 쉘 스크립트
#### kafka-topics

`--create` 옵션으로 파티션을 생성할 수 있다. 
```shell
(base) hangyeong@Hans-MacBook-Pro kafka_2.12-2.5.0 % bin/kafka-topics.sh --create --bootstrap-server localhost:9092 --topic hello.kafka
(base) hangyeong@Hans-MacBook-Pro kafka_2.12-2.5.0 % bin/kafka-topics.sh --bootstrap-server localhost:9092 --list
hello.kafka
```

`--create` 옵션에 추가로 파티션 숫자와 같은 옵션을 넣을 수 있고, 추후 수정 시 `--alter` 로 수정할 수 있다.
```shell
(base) hangyeong@Hans-MacBook-Pro kafka_2.12-2.5.0 % bin/kafka-topics.sh --create --bootstrap-server localhost:9092 --partitions 10 --replication-factor 1 --topic hello.kafka2
WARNING: Due to limitations in metric names, topics with a period ('.') or underscore ('_') could collide. To avoid issues it is best to use either, but not both.
Created topic hello.kafka2.
(base) hangyeong@Hans-MacBook-Pro kafka_2.12-2.5.0 % bin/kafka-topics.sh --bootstrap-server localhost:9092 --topic hello.kafka2 --describe
Topic: hello.kafka2     PartitionCount: 10      ReplicationFactor: 1    Configs: segment.bytes=1073741824
        Topic: hello.kafka2     Partition: 0    Leader: 0       Replicas: 0     Isr: 0
        Topic: hello.kafka2     Partition: 1    Leader: 0       Replicas: 0     Isr: 0
        Topic: hello.kafka2     Partition: 2    Leader: 0       Replicas: 0     Isr: 0
        Topic: hello.kafka2     Partition: 3    Leader: 0       Replicas: 0     Isr: 0
        Topic: hello.kafka2     Partition: 4    Leader: 0       Replicas: 0     Isr: 0
        Topic: hello.kafka2     Partition: 5    Leader: 0       Replicas: 0     Isr: 0
        Topic: hello.kafka2     Partition: 6    Leader: 0       Replicas: 0     Isr: 0
        Topic: hello.kafka2     Partition: 7    Leader: 0       Replicas: 0     Isr: 0
        Topic: hello.kafka2     Partition: 8    Leader: 0       Replicas: 0     Isr: 0
        Topic: hello.kafka2     Partition: 9    Leader: 0       Replicas: 0     Isr: 0
(base) hangyeong@Hans-MacBook-Pro kafka_2.12-2.5.0 % 
(base) hangyeong@Hans-MacBook-Pro kafka_2.12-2.5.0 % bin/kafka-topics.sh --bootstrap-server localhost:9092 --topic hello.kafka2 --alter --partitions 12
(base) hangyeong@Hans-MacBook-Pro kafka_2.12-2.5.0 % bin/kafka-topics.sh --bootstrap-server localhost:9092 --topic hello.kafka2 --describe             
Topic: hello.kafka2     PartitionCount: 12      ReplicationFactor: 1    Configs: segment.bytes=1073741824
        Topic: hello.kafka2     Partition: 0    Leader: 0       Replicas: 0     Isr: 0
        Topic: hello.kafka2     Partition: 1    Leader: 0       Replicas: 0     Isr: 0
        Topic: hello.kafka2     Partition: 2    Leader: 0       Replicas: 0     Isr: 0
        Topic: hello.kafka2     Partition: 3    Leader: 0       Replicas: 0     Isr: 0
        Topic: hello.kafka2     Partition: 4    Leader: 0       Replicas: 0     Isr: 0
        Topic: hello.kafka2     Partition: 5    Leader: 0       Replicas: 0     Isr: 0
        Topic: hello.kafka2     Partition: 6    Leader: 0       Replicas: 0     Isr: 0
        Topic: hello.kafka2     Partition: 7    Leader: 0       Replicas: 0     Isr: 0
        Topic: hello.kafka2     Partition: 8    Leader: 0       Replicas: 0     Isr: 0
        Topic: hello.kafka2     Partition: 9    Leader: 0       Replicas: 0     Isr: 0
        Topic: hello.kafka2     Partition: 10   Leader: 0       Replicas: 0     Isr: 0
        Topic: hello.kafka2     Partition: 11   Leader: 0       Replicas: 0     Isr: 0
(base) hangyeong@Hans-MacBook-Pro kafka_2.12-2.5.0 % 
```

#### kafka-configs

토픽의 일부 옵션을 수정하기 위해서 사용하는 쉘 스크립트이다.  
아래처럼 --alter, --add-config 옵션으로 min.insync.replicas 옵션을 토픽별로 지정할 수 있다.
```shell
(base) hangyeong@Hans-MacBook-Pro kafka_2.12-2.5.0 % bin/kafka-configs.sh --bootstrap-server my-kafka:9092 --alter --add-config min.insync.replicas=2 --topic hello.kafka2
Completed updating config for topic hello.kafka2.
(base) hangyeong@Hans-MacBook-Pro kafka_2.12-2.5.0 % bin/kafka-topics.sh --topic hello.kafka2 --describe --bootstrap-server my-kafka:9092
Topic: hello.kafka2     PartitionCount: 12      ReplicationFactor: 1    Configs: min.insync.replicas=2,segment.bytes=1073741824
        Topic: hello.kafka2     Partition: 0    Leader: 0       Replicas: 0     Isr: 0
        Topic: hello.kafka2     Partition: 1    Leader: 0       Replicas: 0     Isr: 0
        Topic: hello.kafka2     Partition: 2    Leader: 0       Replicas: 0     Isr: 0
        Topic: hello.kafka2     Partition: 3    Leader: 0       Replicas: 0     Isr: 0
        Topic: hello.kafka2     Partition: 4    Leader: 0       Replicas: 0     Isr: 0
        Topic: hello.kafka2     Partition: 5    Leader: 0       Replicas: 0     Isr: 0
        Topic: hello.kafka2     Partition: 6    Leader: 0       Replicas: 0     Isr: 0
        Topic: hello.kafka2     Partition: 7    Leader: 0       Replicas: 0     Isr: 0
        Topic: hello.kafka2     Partition: 8    Leader: 0       Replicas: 0     Isr: 0
        Topic: hello.kafka2     Partition: 9    Leader: 0       Replicas: 0     Isr: 0
        Topic: hello.kafka2     Partition: 10   Leader: 0       Replicas: 0     Isr: 0
        Topic: hello.kafka2     Partition: 11   Leader: 0       Replicas: 0     Isr: 0
```

아래처럼 --broker, --all, --describe 옵션으로 브로커의 server.properties 값을 확인할 수 있다.
```shell
(base) hangyeong@Hans-MacBook-Pro kafka_2.12-2.5.0 % bin/kafka-configs.sh --bootstrap-server my-kafka:9092 --broker 0 --all --describe | grep "partitions"    
  offsets.topic.num.partitions=50 sensitive=false synonyms={DEFAULT_CONFIG:offsets.topic.num.partitions=50}
  transaction.state.log.num.partitions=50 sensitive=false synonyms={DEFAULT_CONFIG:transaction.state.log.num.partitions=50}
  num.partitions=1 sensitive=false synonyms={STATIC_BROKER_CONFIG:num.partitions=1, DEFAULT_CONFIG:num.partitions=1}
(base) hangyeong@Hans-MacBook-Pro kafka_2.12-2.5.0 %
```

#### kafka-console-producer.sh
스크립트를 통해 테스트 용도로 토픽에 데이터를 넣을 수 있다.  
`parse.key` 와 `key.separator` 옵션으로 콘솔에서도 메시지 키를 지정해 보낼 수 있다. 

```shell
(base) hangyeong@Hans-MacBook-Pro kafka_2.12-2.5.0 % bin/kafka-console-producer.sh --bootstrap-server localhost:9092 \
--topic hello.kafka2 --property "parse.key=true" --property="key.separator=:"
>HELLO:HELLO2
```

#### kafka-console-consumer.sh
스크립트를 통해 테스트 용도로 토픽에 데이터를 컨슘할 수 있다.
- `--from-beginning` 옵션을 통해 처음부터 가져오도록 할 수 있다.
- `--max-messages` 로 최대 컨슘 메시지 개수를 정할 수 있다.
- `--partition` 옵션으로 특정 파티션만 컨슘할 수 있다.
- `--group` 옵션으로 특정 컨슈머 그룹을 기반으로 동작하게 할 수 있다.

```shell
(base) hangyeong@Hans-MacBook-Pro kafka_2.12-2.5.0 % ./bin/kafka-console-consumer.sh --bootstrap-server localhost:9092 \ 
--topic hello.kafka2 --property print.key=true --property key.separator="-" --from-beginning
HELLO2
```

#### kafka-consumer-groups.sh
컨슈머 그룹을 관리할 때 활용한다.

```shell
(base) hangyeong@Hans-MacBook-Pro kafka_2.12-2.5.0 % ./bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --list
hello-group
```

아래 describe 명령어를 통해 컨슈머 그룹별로 파티션 번호, 오프셋, 컨슈머 랙, 컨슈머 ID, 호스트 들을 알 수 있다.
```shell
(base) hangyeong@Hans-MacBook-Pro kafka_2.12-2.5.0 % ./bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --group hello-group --describe

Consumer group 'hello-group' has no active members.

GROUP           TOPIC              PARTITION  CURRENT-OFFSET  LOG-END-OFFSET  LAG             CONSUMER-ID     HOST            CLIENT-ID
hello-group     hello.kafka2       10         0               0               0               -               -               -
hello-group     __consumer_offsets 13         0               0               0               -               -               -
hello-group     __consumer_offsets 46         0               0               0               -               -               -

```

컨슈머 그룹별로 Offset 를 리셋해주거나 할 수 있다. 활용할 수 있는 옵션은 아래와 같다.
- `--to-earliest` : 가장 처음 오프셋으로 리셋
- `--to-latest` : 가장 마지막 오프셋으로 리셋
- `--to-current` : 현 시점 기준 오프셋으로 리셋
- `--to-datetime {YYYY-MM-DDTHH:mmSS.sss}` : 특정 일시로 오프셋 리셋(레코드 타임스탬프 기준)
- `--to-offset {long}` : 특정 오프셋으로 리셋
- `--shift-by {+/- long}` : 현재 컨슈머 오프셋에서 앞뒤로 옮겨서 리셋
```shell
(base) hangyeong@Hans-MacBook-Pro kafka_2.12-2.5.0 % ./bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --group hello-group --topic hello.kafka2 --reset-offsets --to-earliest --execute

GROUP                          TOPIC                          PARTITION  NEW-OFFSET     
hello-group                    hello.kafka2                   8          0              
hello-group                    hello.kafka2                   4          0              
hello-group                    hello.kafka2                   0          0              
hello-group                    hello.kafka2                   5          0              
hello-group                    hello.kafka2                   6          0              
hello-group                    hello.kafka2                   10         0              
hello-group                    hello.kafka2                   11         0              
hello-group                    hello.kafka2                   7          0              
hello-group                    hello.kafka2                   9          0              
hello-group                    hello.kafka2                   3          0              
hello-group                    hello.kafka2                   2          0              
hello-group                    hello.kafka2                   1          0              
(base) hangyeong@Hans-MacBook-Pro kafka_2.12-2.5.0 % 
```

파티션 단위로 리셋할 경우, `토픽이름:파티션번호` 로 지정한다.
```shell
(base) hangyeong@Hans-MacBook-Pro kafka_2.12-2.5.0 % ./bin/kafka-consumer-groups.sh --bootstrap-server localhost:9092 --group hello-group --topic hello.kafka:0 --reset-offsets --to-earliest --execute

GROUP                          TOPIC                          PARTITION  NEW-OFFSET     
hello-group                    hello.kafka                    0          0  
```

#### kafka-producer-perf-test.sh
카프카 브로커로 Producer 성능 테스트를 할때 활용할 수 있다.

```shell
(base) hangyeong@Hans-MacBook-Pro kafka_2.12-2.5.0 % bin/kafka-producer-perf-test.sh --producer-props bootstrap.servers=localhost:9092 \
--topic hello.kafka --num-records 10 --throughput 10 --record-size 100 --print-metric
10 records sent, 10.593220 records/sec (0.00 MB/sec), 14.40 ms avg latency, 98.00 ms max latency, 6 ms 50th, 98 ms 95th, 98 ms 99th, 98 ms 99.9th.
```

#### kafka-consumer-perf-test.sh
카프카 브로커로 Consumer 성능 테스트를 할때 활용할 수 있다.
```shell
(base) hangyeong@Hans-MacBook-Pro kafka_2.12-2.5.0 % bin/kafka-consumer-perf-test.sh --bootstrap-server localhost:9092 --topic hello.kafka --messages 10 --show-detailed-stats
time, threadId, data.consumed.in.MB, MB.sec, data.consumed.in.nMsg, nMsg.sec, rebalance.time.ms, fetch.time.ms, fetch.MB.sec, fetch.nMsg.sec
```

#### kafka-reassign-partitions.sh
특정 브로커에 리더들이 많이 몰려있을 경우, 이걸 분배하기 위해 활용한다.

#### kafka-delete-record.sh
특정 파티션의 데이터를 논리적으로 제거하기 위해 사용한다. low_watermark 를 설정해서 특정 Offset 까지 없는 것 처럼 설정할 수 있다.

#### kafka-dump-log.sh
index, timeindex, log 파일과 같이 특정 세그먼트에 대한 로그 확인이 필요할 때 활용한다.
```shell
(base) hangyeong@Hans-MacBook-Pro kafka_2.12-2.5.0 % bin/kafka-dump-log.sh --files data/hello.kafka2-7/00000000000000000000.log --deep-iteration
Dumping data/hello.kafka2-7/00000000000000000000.log
Starting offset: 0
baseOffset: 0 lastOffset: 0 count: 1 baseSequence: -1 lastSequence: -1 producerId: -1 producerEpoch: -1 partitionLeaderEpoch: 0 isTransactional: false isControl: false position: 0 CreateTime: 1771747814390 size: 79 magic: 2 compresscodec: NONE crc: 2333054781 isvalid: true
| offset: 0 CreateTime: 1771747814390 keysize: 5 valuesize: 6 sequence: -1 headerKeys: []
baseOffset: 1 lastOffset: 1 count: 1 baseSequence: -1 lastSequence: -1 producerId: -1 producerEpoch: -1 partitionLeaderEpoch: 0 isTransactional: false isControl: false position: 79 CreateTime: 1771850816331 size: 79 magic: 2 compresscodec: NONE crc: 3022091137 isvalid: true
| offset: 1 CreateTime: 1771850816331 keysize: 5 valuesize: 6 sequence: -1 headerKeys: []
baseOffset: 2 lastOffset: 2 count: 1 baseSequence: -1 lastSequence: -1 producerId: -1 producerEpoch: -1 partitionLeaderEpoch: 0 isTransactional: false isControl: false position: 158 CreateTime: 1771850863200 size: 79 magic: 2 compresscodec: NONE crc: 4153439982 isvalid: true
| offset: 2 CreateTime: 1771850863200 keysize: 5 valuesize: 6 sequence: -1 headerKeys: []
baseOffset: 3 lastOffset: 3 count: 1 baseSequence: -1 lastSequence: -1 producerId: -1 producerEpoch: -1 partitionLeaderEpoch: 0 isTransactional: false isControl: false position: 237 CreateTime: 1771850865616 size: 79 magic: 2 compresscodec: NONE crc: 1953082368 isvalid: true
| offset: 3 CreateTime: 1771850865616 keysize: 5 valuesize: 6 sequence: -1 headerKeys: []
baseOffset: 4 lastOffset: 4 count: 1 baseSequence: -1 lastSequence: -1 producerId: -1 producerEpoch: -1 partitionLeaderEpoch: 0 isTransactional: false isControl: false position: 316 CreateTime: 1771850888053 size: 79 magic: 2 compresscodec: NONE crc: 4064823505 isvalid: true
| offset: 4 CreateTime: 1771850888053 keysize: 5 valuesize: 6 sequence: -1 headerKeys: []
baseOffset: 5 lastOffset: 5 count: 1 baseSequence: -1 lastSequence: -1 producerId: -1 producerEpoch: -1 partitionLeaderEpoch: 0 isTransactional: false isControl: false position: 395 CreateTime: 1771850892017 size: 79 magic: 2 compresscodec: NONE crc: 705408482 isvalid: true
| offset: 5 CreateTime: 1771850892017 keysize: 5 valuesize: 6 sequence: -1 headerKeys: []
(base) hangyeong@Hans-MacBook-Pro kafka_2.12-2.5.0 % bin/kafka-dump-log.sh --files data/hello.kafka2-7/00000000000000000000.index --deep-iteration
Dumping data/hello.kafka2-7/00000000000000000000.index
offset: 0 position: 0
(base) hangyeong@Hans-MacBook-Pro kafka_2.12-2.5.0 % 
```
