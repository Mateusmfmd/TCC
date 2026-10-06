<?php
require_once 'config.php'; require_once 'helpers.php';
$data=corpoJson(); $token=$data['token']??'';
if($token){$st=$conn->prepare("DELETE FROM sessoes WHERE token=?");$st->bind_param("s",$token);$st->execute();}
responder(['success'=>true]);
