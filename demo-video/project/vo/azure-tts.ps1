# Narration via Azure AI Speech (neural TTS, REST). Reads the key from the user's environment; never prints it.
param([string]$Dir = $PSScriptRoot, [string]$Voice = 'en-IN-NeerjaNeural', [string]$Rate = '-4%', [string]$OutDir = (Join-Path $PSScriptRoot 'azure'))
$key = [Environment]::GetEnvironmentVariable('AZURE_SPEECH_KEY', 'User'); if (-not $key) { $key = $env:AZURE_SPEECH_KEY }
$region = [Environment]::GetEnvironmentVariable('AZURE_SPEECH_REGION', 'User'); if (-not $region) { $region = $env:AZURE_SPEECH_REGION }
if (-not $key -or -not $region) { throw 'AZURE_SPEECH_KEY / AZURE_SPEECH_REGION are not set for this user.' }
if ($region -notmatch '^[a-z0-9]+$') { throw 'AZURE_SPEECH_REGION should look like "centralindia".' }
New-Item -ItemType Directory -Force $OutDir | Out-Null
$uri = "https://$region.tts.speech.microsoft.com/cognitiveservices/v1"
$headers = @{ 'Ocp-Apim-Subscription-Key' = $key; 'X-Microsoft-OutputFormat' = 'riff-48khz-16bit-mono-pcm'; 'User-Agent' = 'investor-assistant-demo' }
"Voice: $Voice  Region: $region"
foreach ($line in Get-Content (Join-Path $Dir 'lines.txt') -Encoding UTF8) {
  if (-not $line.Trim()) { continue }
  $id, $text = $line.Split('|', 2)
  $esc = [System.Security.SecurityElement]::Escape($text)
  $ssml = "<speak version='1.0' xmlns='http://www.w3.org/2001/10/synthesis' xml:lang='en-IN'><voice name='$Voice'><prosody rate='$Rate'>$esc</prosody></voice></speak>"
  $out = Join-Path $OutDir "$id.wav"
  try {
    Invoke-WebRequest -Uri $uri -Method Post -Headers $headers -ContentType 'application/ssml+xml; charset=utf-8' -Body ([Text.Encoding]::UTF8.GetBytes($ssml)) -OutFile $out -UseBasicParsing | Out-Null
    "$id ok $((Get-Item $out).Length) bytes"
  } catch { "$id FAILED: $($_.Exception.Response.StatusCode.value__) $($_.Exception.Message -replace [regex]::Escape($key), '***')" ; break }
}
