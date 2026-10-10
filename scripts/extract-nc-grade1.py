"""Extract the official reference's objectives; excludes alternate/proficiency appendices."""
from pathlib import Path
import re,json
pages=Path('/tmp/nc-grade1.txt').read_text().split('\f')
areas={'Dance':[5],'General Music':[6],'Theatre Arts':[11],'Visual Arts':[12],'Computer Science':[13,14],'Digital Learning':[15,16],'English Language Arts':[17,18,19,20,21],'Health Education':[25,26],'Physical Education':[27],'Mathematics':[28,29,30],'Science':[33],'Social Studies':[35,36],'Student Success':[39,40]}
pat=re.compile(r'^\s*((?:NC\.1\.[A-Z]+\.\d+|(?:RL|RI|RF|W|SL|L)\.1\.\d+|(?:PS|LS|ESS)\.1\.\d+(?:\.\d+)?|PE\.1\.[A-Z]+\.\d+\.\d+|1\.[A-Z&]+\.\d+(?:\.\d+)?|I\.1\.\d+|K2-[A-Z]+-\d+|[1-7][a-d]\.|M[1-6]|B-(?:LS|SMS|SS)\d+))(?:\s+|$)')
result=[]
for area,indices in areas.items():
 current=None
 for i in indices:
  for line in pages[i].splitlines():
   line=line.replace('\x07','')
   m=pat.match(line)
   if m:
    code=m.group(1).rstrip('.')
    if area=='Digital Learning':code='DL.'+code
    current={'area':area,'code':code,'objective':line[m.end():].strip()}; result.append(current)
   elif current and line.strip() and len(line)-len(line.lstrip())>=7 and not re.search('QUICK REFERENCE|1ST GRADE',line):
    current['objective']+=' '+line.strip()
   else:current=None
seen=set();out=[]
for s in result:
 key=s['area']+':'+s['code']
 if key in seen:continue
 seen.add(key)
 s['objective']=re.sub(r'\b([A-Z]) ([a-z]{2,})',r'\1\2',s['objective'])
 s['objective']=' '.join(s['objective'].split())
 if s['code']=='RL.1.8':continue # explicitly not applicable
 out.append(s)
Path('src/data/ncGrade1Standards.json').write_text(json.dumps(out,indent=2)+'\n')
print({area:sum(s['area']==area for s in out) for area in areas});print('total',len(out))
