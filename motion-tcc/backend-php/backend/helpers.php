<?php
function gerarCodigoPareamento() {
    return str_pad((string)random_int(0, 999999), 6, '0', STR_PAD_LEFT);
}
function gerarDeviceSecret() { return bin2hex(random_bytes(32)); }
function gerarTokenSessao() { return bin2hex(random_bytes(32)); }

function formatarCrianca($row) {
    if (!$row) return $row;
    foreach (['tempo_resposta','varredura_velocidade'] as $k) if (isset($row[$k])) $row[$k]=(int)$row[$k];
    foreach (['velocidade_voz','volume'] as $k) if (isset($row[$k])) $row[$k]=(float)$row[$k];
    foreach (['alto_contraste','alvos_gigantes','varredura_ativa'] as $k) if (isset($row[$k])) $row[$k]=(bool)$row[$k];
    return $row;
}
function corpoJson() {
    $data=json_decode(file_get_contents('php://input'), true);
    return is_array($data) ? $data : [];
}
function responder($payload) {
    echo json_encode($payload, JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES);
    exit;
}
function erro($mensagem,$codigoHttp=400) {
    http_response_code($codigoHttp);
    responder(['success'=>false,'message'=>$mensagem]);
}
function criarSessao($conn,$usuario_id) {
    $token=gerarTokenSessao();
    $stmt=$conn->prepare("INSERT INTO sessoes (usuario_id,token,expira_em) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 180 DAY))");
    $stmt->bind_param("is",$usuario_id,$token);
    if(!$stmt->execute()) erro('Não foi possível criar a sessão',500);
    return $token;
}
function exigirSessao($conn,$token) {
    if(empty($token)) erro('Sessão inválida, faça login novamente',401);
    $stmt=$conn->prepare("SELECT u.id_usuario,u.nome,u.email FROM sessoes s JOIN usuarios u ON u.id_usuario=s.usuario_id WHERE s.token=? AND s.expira_em>NOW() LIMIT 1");
    $stmt->bind_param("s",$token);
    $stmt->execute();
    $r=$stmt->get_result();
    if(!$r || !$r->num_rows) erro('Sessão expirada, faça login novamente',401);
    return $r->fetch_assoc();
}
function exigirCriancaDoUsuario($conn,$crianca_id,$usuario_id) {
    $stmt=$conn->prepare("SELECT * FROM criancas WHERE id_crianca=? AND usuario_id=? LIMIT 1");
    $stmt->bind_param("ii",$crianca_id,$usuario_id); $stmt->execute(); $r=$stmt->get_result();
    if(!$r || !$r->num_rows) erro('Criança não encontrada ou não pertence a este usuário',403);
    return $r->fetch_assoc();
}
function exigirDispositivoPareado($conn,$secret) {
    $stmt=$conn->prepare("SELECT c.* FROM dispositivos_crianca d JOIN criancas c ON c.id_crianca=d.crianca_id WHERE d.device_secret=? LIMIT 1");
    $stmt->bind_param("s",$secret); $stmt->execute(); $r=$stmt->get_result();
    if(!$r || !$r->num_rows) erro('Dispositivo não pareado ou pareamento inválido',401);
    $conn->query("UPDATE dispositivos_crianca SET ultimo_acesso=NOW() WHERE device_secret='".$conn->real_escape_string($secret)."'");
    return $r->fetch_assoc();
}
function semearConteudoPadrao($conn,$crianca_id) {
    $cats=$conn->query("SELECT * FROM categorias WHERE crianca_id IS NULL ORDER BY ordem");
    while($cat=$cats->fetch_assoc()) {
        $stmt=$conn->prepare("INSERT INTO categorias (crianca_id,nome_categoria,emoji,cor,ordem) VALUES (?,?,?,?,?)");
        $stmt->bind_param("isssi",$crianca_id,$cat['nome_categoria'],$cat['emoji'],$cat['cor'],$cat['ordem']);
        $stmt->execute(); $nova=$conn->insert_id;
        $falas=$conn->query("SELECT * FROM falas WHERE id_categoria=".(int)$cat['id_categoria']." ORDER BY ordem");
        while($f=$falas->fetch_assoc()) {
            $st=$conn->prepare("INSERT INTO falas (id_categoria,texto,emoji,ordem) VALUES (?,?,?,?)");
            $st->bind_param("issi",$nova,$f['texto'],$f['emoji'],$f['ordem']); $st->execute();
        }
    }
}
?>
