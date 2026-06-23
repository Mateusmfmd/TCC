from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
import pygame
import serial
import threading
import os
import subprocess
import time
from datetime import datetime

app = Flask(__name__)
CORS(app)

# Configurações
DB_CONFIG = {'host': 'localhost', 'user': 'root', 'password': '', 'database': 'bd_comunicacao'}
SERIAL_PORT = 'COM6'
BAT_PATH = r'C:\xampp2\htdocs\tcc_php\sons\INICIAR_SISTEMA.bat'
SONS_PATH = r'C:\xampp2\htdocs\tcc_php\sons'

pygame.mixer.init()

def get_db():
    return mysql.connector.connect(**DB_CONFIG)

# ─────────────────────────────────────────
# HARDWARE MONITOR (THREAD)
# ─────────────────────────────────────────
def monitor_arduino():
    while True:
        try:
            ser = serial.Serial(SERIAL_PORT, 9600, timeout=1)
            print(f"[ARDUINO] Conectado na porta {SERIAL_PORT}")
            while True:
                if ser.in_waiting > 0:
                    cor = ser.readline().decode('utf-8').strip()
                    print(f"[ARDUINO] Cor recebida: {cor}")
                    tocar_som(cor)
                time.sleep(0.1)
        except Exception as e:
            print(f"[ARDUINO] Erro: {e} - Tentando reconectar em 5s...")
            time.sleep(5)

def tocar_som(cor):
    try:
        conn = get_db()
        cursor = conn.cursor(dictionary=True)
        cores = {'amarelo': 1, 'verde': 2, 'azul': 3, 'vermelho': 4, 'preto': 5}
        id_botao = cores.get(cor.lower())
        if not id_botao:
            print(f"[SOM] Cor desconhecida: {cor}")
            return
        cursor.execute("SELECT nome_audio FROM configuracao_botoes WHERE id_botao = %s", (id_botao,))
        row = cursor.fetchone()
        if row:
            path = os.path.join(SONS_PATH, row['nome_audio'])
            print(f"[SOM] Tocando: {path}")
            if os.path.exists(path):
                pygame.mixer.music.load(path)
                pygame.mixer.music.play()
            else:
                print(f"[SOM] Arquivo não encontrado: {path}")
        cursor.close()
        conn.close()
    except Exception as e:
        print(f"[SOM] Erro: {e}")

threading.Thread(target=monitor_arduino, daemon=True).start()

# ─────────────────────────────────────────
# API ROUTES
# ─────────────────────────────────────────

@app.route('/executar_bat', methods=['GET'])
def executar_bat():
    try:
        if os.path.exists(BAT_PATH):
            subprocess.Popen([BAT_PATH], shell=True)
            return jsonify({'success': True, 'message': 'BAT iniciado com sucesso'})
        else:
            return jsonify({'success': False, 'message': 'Arquivo BAT não encontrado: ' + BAT_PATH})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})

@app.route('/login.php', methods=['POST'])
def login():
    d = request.json
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT * FROM usuarios WHERE email = %s AND senha = %s", (d['email'], d['senha']))
    u = cursor.fetchone()
    cursor.close()
    conn.close()
    return jsonify({'success': True, 'usuario': u}) if u else jsonify({'success': False, 'message': 'Usuário ou senha inválidos'})

@app.route('/cadastrar.php', methods=['POST'])
def cadastrar():
    d = request.json
    conn = get_db()
    cursor = conn.cursor()
    try:
        cursor.execute("INSERT INTO usuarios (nome, email, senha) VALUES (%s, %s, %s)", (d['nome'], d['email'], d['senha']))
        conn.commit()
        return jsonify({'success': True})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)})
    finally:
        cursor.close()
        conn.close()

@app.route('/frases.php', methods=['GET', 'POST', 'DELETE'])
def frases():
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    res = {'success': False}
    if request.method == 'GET':
        cursor.execute("SELECT * FROM frases WHERE usuario_id = %s ORDER BY id_frase DESC", (request.args.get('usuario_id'),))
        res = {'success': True, 'frases': cursor.fetchall()}
    elif request.method == 'POST':
        d = request.json
        cursor.execute("INSERT INTO frases (usuario_id, texto) VALUES (%s, %s)", (d['usuario_id'], d['texto']))
        conn.commit()
        res = {'success': True}
    elif request.method == 'DELETE':
        cursor.execute("DELETE FROM frases WHERE id_frase = %s", (request.json['id_frase'],))
        conn.commit()
        res = {'success': True}
    cursor.close()
    conn.close()
    return jsonify(res)

@app.route('/rotinas.php', methods=['GET', 'POST', 'DELETE'])
def rotinas():
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    res = {'success': False}
    if request.method == 'GET':
        cursor.execute("SELECT * FROM rotinas WHERE usuario_id = %s ORDER BY horario", (request.args.get('usuario_id'),))
        res = {'success': True, 'rotinas': cursor.fetchall()}
    elif request.method == 'POST':
        d = request.json
        cursor.execute("INSERT INTO rotinas (usuario_id, atividade, horario) VALUES (%s, %s, %s)", (d['usuario_id'], d['atividade'], d['horario']))
        conn.commit()
        res = {'success': True}
    elif request.method == 'DELETE':
        cursor.execute("DELETE FROM rotinas WHERE id_rotina = %s", (request.json['id_rotina'],))
        conn.commit()
        res = {'success': True}
    cursor.close()
    conn.close()
    return jsonify(res)

@app.route('/lembretes.php', methods=['GET', 'POST', 'DELETE', 'PUT'])
def lembretes():
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    res = {'success': False}
    if request.method == 'GET':
        cursor.execute("SELECT * FROM lembretes WHERE usuario_id = %s", (request.args.get('usuario_id'),))
        res = {'success': True, 'lembretes': cursor.fetchall()}
    elif request.method == 'POST':
        cursor.execute("INSERT INTO lembretes (usuario_id, texto) VALUES (%s, %s)", (request.json['usuario_id'], request.json['texto']))
        conn.commit()
        res = {'success': True}
    elif request.method == 'PUT':
        cursor.execute("UPDATE lembretes SET feito = %s WHERE id_lembrete = %s", (request.json['feito'], request.json['id_lembrete']))
        conn.commit()
        res = {'success': True}
    elif request.method == 'DELETE':
        cursor.execute("DELETE FROM lembretes WHERE id_lembrete = %s", (request.json['id_lembrete'],))
        conn.commit()
        res = {'success': True}
    cursor.close()
    conn.close()
    return jsonify(res)

@app.route('/historico.php', methods=['GET', 'POST'])
def historico():
    conn = get_db()
    cursor = conn.cursor(dictionary=True)
    res = {'success': False}
    if request.method == 'GET':
        cursor.execute("SELECT * FROM historico WHERE usuario_id = %s ORDER BY data_uso DESC", (request.args.get('usuario_id'),))
        res = {'success': True, 'historico': cursor.fetchall()}
    else:
        d = request.json
        cursor.execute("INSERT INTO historico (usuario_id, texto, emoji, data_uso) VALUES (%s, %s, %s, %s)",
                       (d['usuario_id'], d['texto'], d['emoji'], datetime.now()))
        conn.commit()
        res = {'success': True}
    cursor.close()
    conn.close()
    return jsonify(res)

@app.route('/configurar_botao.php', methods=['POST'])
def config_b():
    d = request.form
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("UPDATE configuracao_botoes SET nome_audio = %s WHERE id_botao = %s", (d['nome_audio'], d['id_botao']))
    conn.commit()
    cursor.close()
    conn.close()
    return jsonify({'success': True})

if __name__ == '__main__':
    print("=" * 40)
    print("   MOTION SYSTEM INICIADO")
    print(f"   Sons: {SONS_PATH}")
    print(f"   Arduino: {SERIAL_PORT}")
    print("=" * 40)
app.run(
    host='0.0.0.0',
    port=5000,
    debug=True,
    use_reloader=False
)