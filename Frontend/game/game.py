# game.py
import sys
import os
import random
import json
from datetime import datetime
from flask import Flask, request, jsonify, send_from_directory

# 경로 설정
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

app = Flask(__name__)

# 게임 기록 저장 (메모리 기반, 실제 서비스에서는 DB 사용 권장)
game_history = []

# 현재 게임 세션 정보
current_game_session = None

# 족보 점수 체계
pattern_scores = {
    # 특수 족보
    "38광땡": 200,
    "18광땡": 150,
    "13광땡": 130,
    
    "암행어사": 11,
    "땡잡이": 10,
    "구사": 90,
    "멍텅구리 구사":109,
    
    # 땡
    "장땡": 110,
    "9땡": 99,
    "8땡": 98,
    "7땡": 97,
    "6땡": 96,
    "5땡": 95,
    "4땡": 94,
    "3땡": 93,
    "2땡": 92,
    "1땡": 91,
    
    # 특수 조합
    "알리": 80,
    "독사": 70,
    "구삥": 60,
    "장삥": 50,
    "장사": 40,
    "세륙": 30,
    "갑오": 20,
    
    # 끗
    "8끗": 18,
    "7끗": 17,
    "6끗": 16,
    "5끗": 15,
    "4끗": 14,
    "3끗": 13,
    "2끗": 12,
    "1끗": 11,
    "망통": 10

}

# 카드 클래스
class Card:
    def __init__(self, month, type):
        self.month = month  # 1~10월
        self.type = type    # 1: 광,열끗 , 2: 띠
    
    def to_dict(self):
        return {
            'month': self.month,
            'type': self.type
        }

# 섯다 게임 클래스
class SutdaGame:
    def __init__(self, player_count):
        self.player_count = player_count
        self.deck = self._initialize_deck()
        self.players = []
        self._deal_cards()
    
    def _initialize_deck(self):
        # 1월부터 10월까지, 각 월마다 2장씩 카드 생성
        deck = []
        for month in range(1, 11):
            for type in range(1, 3):
                deck.append(Card(month, type))
        
        # 카드 섞기
        random.shuffle(deck) 
        return deck
    
    def _deal_cards(self):
        # 각 플레이어에게 2장씩 카드 배분
        for _ in range(self.player_count):
            if len(self.deck) < 2:
                # 카드가 부족하면 덱 초기화
                self.deck = self._initialize_deck()
            
            # 2장의 카드 뽑기
            cards = [self.deck.pop(), self.deck.pop()]
            pattern = self._calculate_pattern(cards)
            score = self._get_pattern_score(pattern)
            
            self.players.append({
                'cards': cards,
                'pattern': pattern,
                'score': score,
                'isWinner': False  # 승자 여부는 나중에 결정
            })

        # 승자 결정
        self._determine_winner()
    
    def _calculate_pattern(self, cards):
        # 카드 월 정보
        month1 = cards[0].month
        month2 = cards[1].month
        
        # 카드 타입 정보
        type1 = cards[0].type
        type2 = cards[1].type
        
        # 암행어사 (4월 열끗, 7월 열끗)
        if (month1 == 4 and month2 == 7 and type1 == 2 and type2 == 2) or (month1 == 7 and month2 == 4 and type1 == 2 and type2 == 2) :
            return "암행어사"
        
        # 땡잡이 (3월 광 , 7월 열끗)
        if (month1 == 3 and month2 == 7 and type1 == 1 and type2 == 2) or (month1 == 7 and month2 == 3 and type1 == 2 and type2 == 1) :
            return "땡잡이"
        
        # 38광땡 (3월, 8월 모두 광)
        if ((month1 == 3 and month2 == 8) or (month1 == 8 and month2 == 3)) and type1 == 1 and type2 == 1:
            return "38광땡"
        
        # 18광땡 (1월, 8월 모두 광)
        if ((month1 == 1 and month2 == 8) or (month1 == 8 and month2 == 1)) and type1 == 1 and type2 == 1:
            return "18광땡"
        
        # 13광땡 (1월, 3월 모두 광)
        if ((month1 == 1 and month2 == 3) or (month1 == 3 and month2 == 1)) and type1 == 1 and type2 == 1:
            return "13광땡"
        
        # 땡 (같은 월)
        if month1 == month2:
            if month1 == 10:
                return "장땡"
            else:
                return f"{month1}땡"
        
        # 알리 (1월, 2월)
        if (month1 == 1 and month2 == 2) or (month1 == 2 and month2 == 1):
            return "알리"
        
        # 독사 (1월, 4월)
        if (month1 == 1 and month2 == 4) or (month1 == 4 and month2 == 1):
            return "독사"
        
        # 구삥 (9월, 1월)
        if (month1 == 9 and month2 == 1) or (month1 == 1 and month2 == 9):
            return "구삥"
        
        # 장삥 (10월, 1월)
        if (month1 == 10 and month2 == 1) or (month1 == 1 and month2 == 10):
            return "장삥"
        
        # 장사 (10월, 4월)
        if (month1 == 10 and month2 == 4) or (month1 == 4 and month2 == 10):
            return "장사"
        
        # 세륙 (4월, 6월)
        if (month1 == 4 and month2 == 6) or (month1 == 6 and month2 == 4):
            return "세륙"
        
        # 구사,멍텅구리 구사 (4월, 9월),(4월 열끗, 9월 열끗)
        if (month1 == 4 and month2 == 9) or (month1 == 9 and month2 == 4):
            if (type1 == 2 and type2 == 2):
                return "멍텅구리 구사"
            return "구사"

        # 끗 (나머지)
        sum_value = (month1 + month2) % 10
        if sum_value == 9:
            return "갑오"
        elif sum_value == 0:
            return "망통"
        
        return f"{sum_value}끗"
    
    def to_dict(self):
        result = {
            'players': []
        }
        
        for player in self.players:
            player_dict = {
                'cards': [card.to_dict() for card in player['cards']],
                'pattern': player['pattern']
            }
            result['players'].append(player_dict)
        
        return result

    def _get_pattern_score(self, pattern):
        # 족보 점수 반환
        if pattern in pattern_scores:
            return pattern_scores[pattern]
        
        # 기본값 (알 수 없는 패턴)
        return 0
    
    def _determine_winner(self):
        # 각 플레이어의 점수 확인
        scores = [player['score'] for player in self.players]
        
        #특수 족보 적용용
        for player in self.players:
            if player['pattern'] == "암행어사":
                if any(op['pattern'] in ["18광땡", "13광땡"] for op in self.players):
                    player['score'] += 140
            elif player['pattern'] == "땡잡이":
                if any(op['pattern'] in ["9땡", "8땡", "7땡", "6땡", "5땡", "4땡", "3땡", "2땡", "1땡"] for op in self.players):
                    player['score'] += 90
        
        scores = [player['score'] for player in self.players]

        # 최고 점수 찾기
        max_score = max(scores) if scores else 0
        
        # 최고 점수를 가진 플레이어 수 확인 (무승부 체크)
        max_score_count = scores.count(max_score)
        
        # 무승부가 아닌 경우 승자 설정
        if max_score_count == 1:
            winner_index = scores.index(max_score)
            # ✅ 구사 또는 멍텅구리 구사일 경우 무승부 처리
            winner_pattern = self.players[winner_index]['pattern']
            if winner_pattern in ["구사", "멍텅구리 구사"]:
                return -2  # 구새패 재경기!

            self.players[winner_index]['isWinner'] = True
            return winner_index
        else:
            # 무승부
            return -1
    
    def to_dict(self):
        # 승자 결정
        winner_index = self._determine_winner()
        
        # 무승부 여부 확인
        if ( winner_index == -1):
            is_draw = 1 #무승부!
        elif ( winner_index == -2):
            is_draw = -1 #구사패 재경기!
        else:
            is_draw = 0
    
        result = {
            'players': [player for player in self.players],
            'winner': winner_index,
            'isDraw': is_draw,
            #"gusaRematch": gusa_rematch
        }
        
        # 플레이어 정보를 딕셔너리로 변환
        for i, player in enumerate(result['players']):
            result['players'][i] = {
                'cards': [card.to_dict() for card in player['cards']],
                'pattern': player['pattern'],
                'score': player['score'],
                'isWinner': player['isWinner']
            }
        
        return result

# 정적 파일 서빙
@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

# API 엔드포인트: 게임 시작
@app.route('/api/game/start', methods=['POST'])
def start_game():
    global current_game_session
    
    data = request.json
    player_count = data.get('players', 1)
    
    # 플레이어 수 검증
    if player_count < 1 or player_count > 4:
        return jsonify({'error': 'Player count must be between 1 and 4'}), 400
    
    # 새 게임 생성
    game = SutdaGame(player_count)
    game_result = game.to_dict()
    
    # 타임스탬프 추가
    game_result['timestamp'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    # 현재 게임 세션 저장
    current_game_session = game_result
    
    # 게임 기록 저장
    save_game_history(game_result)
    
    return jsonify(game_result)

# API 엔드포인트: 게임 초기화 (카드 재배분 없음)
@app.route('/api/game/reset', methods=['POST'])
def reset_game():
    # 게임 세션 초기화만 수행 (카드 재배분 없음)
    return jsonify({'status': 'success', 'message': 'Game reset successfully'})

# API 엔드포인트: 게임 기록 조회
@app.route('/api/game/history', methods=['GET'])
def get_game_history():
    return jsonify(game_history)

# 게임 기록 저장 함수
def save_game_history(game_result):
    global game_history
    
    # 최대 10개까지만 저장
    if len(game_history) >= 10:
        game_history.pop(0)  # 가장 오래된 기록 제거
    
    game_history.append(game_result)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
