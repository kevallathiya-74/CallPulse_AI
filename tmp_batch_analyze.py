import os, time, csv, glob, requests
from pathlib import Path
BASE='http://127.0.0.1:8000'
TOKEN=os.environ.get('CLERK_TOKEN','').strip()
AGENT_ID='a9260907-1395-4f01-9d68-9d9d8361b88f'
headers={'Authorization':f'Bearer {TOKEN}'}
files=sorted(glob.glob(r'd:\AU HACKATHON 2.0\audio\call_recording_*.wav'))
out=[]
for fp in files:
    name=Path(fp).name
    print('UPLOAD',name)
    with open(fp,'rb') as f:
        r=requests.post(BASE+'/api/analyze',headers=headers,files={'file':(name,f,'audio/wav')},data={'agent_id':AGENT_ID,'campaign_type':''},timeout=120)
    if r.status_code>=400:
        out.append({'file':name,'status':'upload_failed','http':r.status_code,'error':r.text[:300]});print('FAIL',r.status_code);continue
    j=r.json() if r.content else {}
    call_id=j.get('call_id') or j.get('data',{}).get('call_id')
    if not call_id:
        out.append({'file':name,'status':'no_call_id','http':r.status_code,'error':str(j)[:300]});continue
    report_id=None; final_status='unknown'; msg=''
    for _ in range(180):
        s=requests.get(BASE+f'/api/analyze/status/{call_id}',headers=headers,timeout=60)
        sj=s.json() if s.content else {}
        data=sj.get('data',sj)
        final_status=(data.get('status') or data.get('analysis_status') or '').lower()
        report_id=data.get('report_id')
        msg=data.get('message','')
        if final_status in ('complete','completed','failed','error'): break
        time.sleep(2)
    row={'file':name,'call_id':call_id,'status':final_status,'report_id':report_id,'message':msg}
    if final_status in ('complete','completed') and report_id:
        rr=requests.get(BASE+f'/api/reports/{report_id}',headers=headers,timeout=60)
        rj=rr.json() if rr.content else {}
        d=rj.get('data',rj)
        row.update({
            'overall_score':d.get('overall_score'),
            'sentiment_score':d.get('sentiment_score'),
            'empathy_score':d.get('empathy_score'),
            'clarity_score':d.get('clarity_score'),
            'compliance_score':d.get('compliance_score'),
            'resolution_score':d.get('resolution_score'),
            'language_score':d.get('language_score'),
        })
    out.append(row)
    print('DONE',name,row.get('overall_score'))
out_path=Path(r'd:\AU HACKATHON 2.0\Docs\audio_batch_results.csv')
keys=['file','status','call_id','report_id','overall_score','sentiment_score','empathy_score','clarity_score','compliance_score','resolution_score','language_score','message','error','http']
with out_path.open('w',newline='',encoding='utf-8') as f:
    w=csv.DictWriter(f,fieldnames=keys)
    w.writeheader(); w.writerows(out)
print('WROTE',out_path)
