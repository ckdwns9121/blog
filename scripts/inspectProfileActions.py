"""Read sprite alpha and save Rive crop metadata without changing image pixels."""
from pathlib import Path
from PIL import Image
import json, statistics
root=Path(__file__).resolve().parents[1]
def inspect(path,cols,rows,count):
 im=Image.open(path).convert('RGBA');result=[]
 for i in range(count):
  col,row=i%cols,i//cols
  x0,y0,x1,y1=col*im.width//cols,row*im.height//rows,(col+1)*im.width//cols,(row+1)*im.height//rows
  pts={(x,y) for y in range(y0,y1) for x in range(x0,x1) if im.getpixel((x,y))[3]>128}
  largest=[]
  while pts:
   pending=[pts.pop()];part=[]
   while pending:
    x,y=pending.pop();part.append((x,y))
    for q in [(x-1,y),(x+1,y),(x,y-1),(x,y+1)]:
     if q in pts:pts.remove(q);pending.append(q)
   if len(part)>len(largest):largest=part
  assert largest
  l=min(x for x,y in largest);r=max(x for x,y in largest)+1;t=min(y for x,y in largest);b=max(y for x,y in largest)+1
  bands={}
  for x,y in largest:
   if t+(b-t)*.12<y<t+(b-t)*.32:bands.setdefault(y,[]).append(x)
  head=statistics.median((min(xs)+max(xs))/2 for xs in bands.values())
  l=max(x0,l-3);r=min(x1,r+3);t=max(y0,t-3);b=min(y1,b+3)
  scale=740/(b-t)
  result.append({'crop':[l,t,r,b],'scale':scale,'x':512-head*scale,'y':920-b*scale,'head':head})
 return {'width':im.width,'height':im.height,'frames':result}
base=root/'assets/profile-portrait/actions/color'
result={'front':inspect(base/'front.png',2,1,1),'turnaround':inspect(base/'turnaround.png',4,2,8),'laptop':inspect(base/'laptop.png',3,2,6),'scratch':inspect(base/'scratch.png',3,2,6)}
im=Image.open(base/'front.png').convert('RGBA')
result['eyeSkinColors']=[]
for cx in [413,572]:
 colors=[im.getpixel((x,y))[:3] for y in range(315,328) for x in range(cx-20,cx+20)]
 result['eyeSkinColors'].append('FF'+''.join(f'{int(statistics.median(c[i] for c in colors)):02X}' for i in range(3)))
(base/'frames.json').write_text(json.dumps(result,indent=2)+'\n')
print({k:[v['width'],v['height'],len(v['frames'])] for k,v in result.items() if k!='eyeSkinColors'})
