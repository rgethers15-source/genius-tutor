"""Render original layered instrumental compositions; no third-party samples."""
from pathlib import Path
import numpy as np, wave, subprocess, json
ROOT=Path(__file__).resolve().parents[1]
SR=22050
rng=np.random.default_rng(731)
rosters=[('tutor-kaito','Kaito · Neon Notebook','anime'),('tutor-ren','Ren · Midnight Numbers','anime'),('tutor-sora','Sora · Cloud Laboratory','anime'),('tutor-akira','Akira · Story Street','anime'),('tutor-haru','Haru · Aurora Sketchbook','anime')]
princes=['amara','zuri','nia','imani','ayana','sanaa','kaia','makeda']
titles=['Storybook Sunrise','Diamond Garden','Starlight Discovery','Painted Palace','Royal Rhythm','Crystal Conversation','Kindness Courtyard','Golden Heritage']
rosters += [('princess-'+p,p.title()+' · '+titles[i],'royal') for i,p in enumerate(princes)]
rosters += [('royal-prince','Prince Adisa · Garden of Stars','royal')]
ids=['ranger-jay','hero-kofi','rex','scout-malik','hero-zion','ranger-amari','triceratops','hero-noah','explorer-musa']
names=['Jay · Jungle Journal','Kofi · Amber Shield','Rex · Ancient Giants','Malik · Trail Stories','Zion · Homeward Map','Amari · Clear Skies','Trix · Fern Colors','Noah · Expedition Groove','Musa · Roots and Rivers']
rosters += [(i,n,'adventure') for i,n in zip(ids,names)]
scale=[0,2,4,7,9,12,14,16]
manifest={}
for idx,(id,title,kind) in enumerate(rosters):
 bpm=(76+idx%5*3) if kind!='royal' else (84+idx%4*3)
 beat=60/bpm;duration=32*beat;audio=np.zeros((int((duration+2)*SR),2),dtype=np.float64)
 root=48+[0,2,5,7,9][idx%5]
 def note(midi,start,length,amp,instrument='pluck',pan=0):
  n=int(length*SR);t=np.arange(n)/SR;f=440*2**((midi-69)/12)
  if instrument=='pad':
   signal=(np.sin(2*np.pi*f*t)+.25*np.sin(2*np.pi*f*2*t)+.12*np.sin(2*np.pi*f*3.003*t))*np.minimum(t/.25,1)*np.minimum((length-t)/.3,1)*.65
  elif instrument=='bass':signal=np.sin(2*np.pi*f*t)*np.minimum(t/.018,1)*np.exp(-t*3)
  elif instrument=='mallet':signal=(np.sin(2*np.pi*f*t)*np.exp(-t*3)+.4*np.sin(2*np.pi*f*2.76*t)*np.exp(-t*9)+.12*np.sin(2*np.pi*f*5.4*t)*np.exp(-t*15))*np.minimum(t/.006,1)
  else:signal=(np.sin(2*np.pi*f*t)+.35*np.sin(2*np.pi*f*2*t)+.18*np.sin(2*np.pi*f*3*t))*np.minimum(t/.005,1)*np.exp(-t*4)
  pos=int(start*SR);end=min(pos+n,len(audio));sig=signal[:end-pos]*amp
  audio[pos:end,0]+=sig*(.7-pan*.25);audio[pos:end,1]+=sig*(.7+pan*.25)
 progression=[0,5,9,7] if kind=='royal' else [0,9,5,7]
 motif=[(idx*3+j*j+2*j)%8 for j in range(8)]
 for bar in range(8):
  chord=root+progression[bar%4]
  third=3 if progression[bar%4]==9 else 4
  for interval in [0,third,7,14]:note(chord+interval,bar*4*beat,4*beat,.037,'pad',(-1 if interval%2 else 1)*.6)
  for b in range(4):
   at=(bar*4+b)*beat
   note(chord-12+(7 if b==2 else 0),at,beat*.95,.12,'bass')
   for sub in [0,.5]:
    tone=[0,third,7,14][(b*2+int(sub*2)+idx)%4]
    note(chord+12+tone,at+sub*beat,beat*1.2,.055,'pluck',(b%3-1)*.6)
   if b in [0,2]:
    n=int(.2*SR);t=np.arange(n)/SR;s=np.sin(2*np.pi*(50*t+5*(1-np.exp(-t*30))))*np.exp(-t*23)*.12
    pos=int(at*SR);audio[pos:pos+n]+=s[:,None]
   if b in [1,3]:
    n=int(.13*SR);t=np.arange(n)/SR;s=rng.normal(0,1,n)*np.exp(-t*38)*.025;pos=int(at*SR);audio[pos:pos+n]+=s[:,None]
   # A distinct melodic motif, varied into a response on alternate bars.
   degree=motif[(bar%2)*4+b];m=root+24+scale[degree]+(0 if bar<4 else -12)
   note(m,at,beat*1.6,.095,'mallet' if kind=='royal' else 'pluck',.25)
   if kind=='adventure':note(chord+19,at+.75*beat,beat*.4,.032,'mallet',-.6)
 # Wrap sustained tails into the opening for a seamless repeating phrase.
 n=int(duration*SR);tail=audio[n:];audio[:len(tail)]+=tail;audio=audio[:n]
 # Subtle stereo room echoes, with circular wrapping for continuity.
 audio+=np.roll(audio,int(.19*SR),axis=0)*.10+np.roll(audio,int(.31*SR),axis=0)[:,::-1]*.07
 peak=np.max(np.abs(audio));audio=audio/max(peak,1e-6)*.65
 wav=ROOT/'public/music/themes'/f'{id}.wav';mp3=wav.with_suffix('.mp3')
 with wave.open(str(wav),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes((audio*32767).astype('<i2').tobytes())
 subprocess.run(['ffmpeg','-nostdin','-loglevel','error','-y','-i',str(wav),'-codec:a','libmp3lame','-b:a','96k',str(mp3)],check=True);wav.unlink()
 manifest[id]={'title':title,'url':'./music/themes/'+id+'.mp3'}
(ROOT/'src/data/tutorThemes.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Rendered',len(manifest),'original instrumental loops.')
