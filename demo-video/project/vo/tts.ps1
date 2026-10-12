# Synthesises each narration line with the built-in Windows OneCore voice (en-IN Heera).
param([string]$Dir = $PSScriptRoot, [string]$Rate = '-6%')
Add-Type -AssemblyName System.Runtime.WindowsRuntime
$null = [Windows.Media.SpeechSynthesis.SpeechSynthesizer, Windows.Media.SpeechSynthesis, ContentType = WindowsRuntime]
$null = [Windows.Storage.Streams.DataReader, Windows.Storage.Streams, ContentType = WindowsRuntime]
$asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
function Await($op, [type]$t) { $task = $asTask.MakeGenericMethod($t).Invoke($null, @($op)); $task.Wait(-1) | Out-Null; $task.Result }

$s = New-Object Windows.Media.SpeechSynthesis.SpeechSynthesizer
$voice = [Windows.Media.SpeechSynthesis.SpeechSynthesizer]::AllVoices | Where-Object { $_.DisplayName -like '*Heera*' } | Select-Object -First 1
if (-not $voice) { throw 'Heera voice not found' }
$s.Voice = $voice
"Voice: $($voice.DisplayName) ($($voice.Language))"
foreach ($line in Get-Content (Join-Path $Dir 'lines.txt') -Encoding UTF8) {
  if (-not $line.Trim()) { continue }
  $id, $text = $line.Split('|', 2)
  $esc = [System.Security.SecurityElement]::Escape($text)
  $ssml = "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-IN'><voice name='$($voice.DisplayName)'><prosody rate='$Rate' pitch='-2%'>$esc</prosody></voice></speak>"
  $stream = Await ($s.SynthesizeSsmlToStreamAsync($ssml)) ([Windows.Media.SpeechSynthesis.SpeechSynthesisStream])
  $reader = New-Object Windows.Storage.Streams.DataReader($stream.GetInputStreamAt(0))
  $size = [uint32]$stream.Size
  $null = Await ($reader.LoadAsync($size)) ([uint32])
  $bytes = New-Object byte[] $size
  $reader.ReadBytes($bytes)
  [IO.File]::WriteAllBytes((Join-Path $Dir "$id.wav"), $bytes)
  "$id $size bytes"
}
