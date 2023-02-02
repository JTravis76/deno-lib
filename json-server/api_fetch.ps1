#
# Author: Jeremy Travis
# version 1.0.0 - 1/27/2021
# This script reads API end-point and save JSON
# response to the file system for testing/debugging
# in a sandbox environment

Clear-Host


if(!(Test-Path ".\Desktop\API\Dashboard" -PathType Container))
{
  mkdir ".\Desktop\API\Dashboard"
}
if(!(Test-Path ".\Desktop\API\ResourceCenter" -PathType Container))
{
  mkdir ".\Desktop\API\ResourceCenter"
}

# $baseURL = 'https://ecommdealersetup.dealerconnection.com/API/'
$baseURL = 'https://aa2new.jdstaging.com/Ford/FordLincolnEcomm/FESite/API/'

$headers = @{}
$headers.Add("sessionId","a75e9a94-cd1d-4004-bf35-6da8c51a3309")
$headers.Add("token","bc3001f7-c186-44e8-b4ec-901009b8d2c2")

$dealerId = "?dealerId=4331912507"

# == Route end-point list
$list = "FeatureFlag","LoggedInUser","TermsAndConditions","Dashboard/IntroVideo","ActivationSummary",
("Contacts"+$dealerId),("Dashboard/RouteOne"+$dealerId),"ResourceCenter/SearchResults",("Dashboard/Contacts"+$dealerId),
("Notification"+$dealerId),"Dashboard/KDMPositions","Dashboard/Positions","Dashboard/AccordionData","FordPay",
"About","HelpForm"

# == fetch JSON object and save output
foreach ($l in $list) {
    $name = $l.Replace($dealerId, "").Replace("/", "\")
    Write-Host $name

    if ($l.Contains($dealerId))
    {
      $id = $dealerId.Replace("?dealerId=", "-")
      Invoke-WebRequest -Headers $headers -Uri ($baseURL + $l) -OutFile (".\Desktop\API\"+$name+$id+".json")
    }
    else
    {
      Invoke-WebRequest -Headers $headers -Uri ($baseURL + $l) -OutFile (".\Desktop\API\"+$name+".json")
    }
}

# == Create fake authorization object
$auth = [PSCustomObject]@{
  active = "2"
  expireOn = "2025-10-05T02:08:35.793"
  sessionId = $headers.sessionId
  token = $headers.token
  status = 200
  url = $null
  file = $null
}

Set-Content -Path ".\Desktop\API\Auth.json" -Force -Encoding UTF8 -Value ($auth | ConvertTo-Json)
