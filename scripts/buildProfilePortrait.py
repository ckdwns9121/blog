"""Author the approved caricature as an image-backed Rive rig with independent eyes."""
from pathlib import Path
import math, json
import xml.etree.ElementTree as ET
root=Path(__file__).resolve().parents[1]
serial=100

def el(tag,parent=None,**attrs):
 global serial
 serial+=1
 if tag!='Rive':attrs.setdefault('id',f'0:{serial}')
 node=ET.Element(tag,{k:str(v) for k,v in attrs.items()})
 if parent is not None:parent.append(node)
 return node

def bind(node,key,prop):
 el('DataBindContext',node,sourcePathIds=f'0:40-0:{prop}',propertyKey=key)

def fill(node,color):
 el('SolidColor',el('Fill',node),colorValue=color)

def curve(parent,name,points,width=6,color="FF111111"):
 shape=el('Shape',parent,name=name)
 path=el('PointsPath',shape,isClosed='false')
 for (x,y),(ix,iy),(ox,oy) in points:
  el('CubicDetachedVertex',path,x=x,y=y,inRotation=math.atan2(iy-y,ix-x),inDistance=math.hypot(ix-x,iy-y),outRotation=math.atan2(oy-y,ox-x),outDistance=math.hypot(ox-x,oy-y))
 el('SolidColor',el('Stroke',shape,thickness=width,cap='round',join='round'),colorValue=color)
 return shape

meta=json.loads((root/'assets/profile-portrait/actions/color/frames.json').read_text())
r=el('Rive',version=1,kind='fragment')
for key,asset in [('front',1),('turnaround',2),('laptop',3),('scratch',4)]:
 el('ImageAsset',r,id=f'0:{asset}',file=f'actions/color/{key}.png',name=key+' transparent atlas')
a=el('Artboard',r,id='0:20',name='Portrait',width=1024,height=1024,styleId='0:5',defaultStateMachineId='0:7',viewModelId='0:40',viewModelInstanceId='0:41')
el('LayoutComponentStyle',a,id='0:5')
actor=el('Node',a,name='Jump actor')
f=meta['front']['frames'][0]
front=el('Node',actor,name='Front with independent eyes',x=f['x'],y=f['y'],scaleX=f['scale'],scaleY=f['scale'])
for eyeIndex,(name,cx,cy) in enumerate([('Left',413,296),('Right',572,294)]):
 closed=el('Node',front,name=name+' closed eyelid',x=cx,y=cy,opacity=0)
 bind(closed,18,48)
 curve(closed,'Relaxed blink',[((-39,0),(-39,0),(-15,15)),((37,0),(15,15),(37,0))],5)
 eye=el('Node',front,name=name+' eye opening',x=cx,y=cy)
 bind(eye,17,47)
 curve(eye,'Upper eyelid',[((-49,0),(-49,0),(-19,-25)),((32,-2),(11,-23),(32,-2))],6)
 mask=el('Shape',eye,name=name+' pupil clipping boundary',x=-6,y=2)
 el('Ellipse',mask,width=66,height=33)
 gaze=el('Node',eye,name=name+' pupil movement')
 bind(gaze,13,45);bind(gaze,14,46)
 glint=el('Shape',gaze,name=name+' catchlight',x=-9,y=-6)
 el('Ellipse',glint,width=7,height=9);fill(glint,'FFFFFFFF')
 el('ClippingShape',glint,sourceId=mask.get('id'))
 pupil=el('Shape',gaze,name=name+' pupil',x=-1,y=0)
 el('Ellipse',pupil,width=40,height=43);fill(pupil,'FF111111')
 el('ClippingShape',pupil,sourceId=mask.get('id'))
 sclera=el('Shape',eye,name=name+' eye white',x=-6,y=2)
 el('Ellipse',sclera,width=66,height=33);fill(sclera,'FFFFFCF5')
 # Cover only the baked eye marks; eyebrows, hair, face and body stay original.
 patch=el('Shape',front,name=name+' neutral eye backing',x=cx-7,y=cy)
 el('Rectangle',patch,width=132,height=58,cornerRadiusTL=20,cornerRadiusTR=20,cornerRadiusBL=20,cornerRadiusBR=20)
 fill(patch,meta['eyeSkinColors'][eyeIndex])
def sprite(parent,key,index,asset,transformed=False):
 atlas=meta[key];f=atlas['frames'][index];l,t,r,b=f['crop']
 node=parent if transformed else el('Node',parent,name=f'{key} pose {index}',x=f['x'],y=f['y'],scaleX=f['scale'],scaleY=f['scale'],opacity=0)
 image=el('Image',node,assetId=f'0:{asset}',name=f'{key} illustration {index}')
 mesh=el('Mesh',image,triangleIndexBytes='AAECAAID')
 for x,y in [(l,t),(r,t),(r,b),(l,b)]:el('ContourMeshVertex',mesh,x=x,y=y,u=x/atlas['width'],v=y/atlas['height'])
 return node
sprite(front,'front',0,1,True)
poses=[front]+[sprite(actor,'turnaround',i,2) for i in range(8)]+[sprite(actor,'laptop',i,3) for i in range(6)]+[sprite(actor,'scratch',i,4) for i in range(6)]
ring=el('Shape',a,name='Landing ring',x=512,y=921,opacity=0)
el('Ellipse',ring,width=340,height=38)
el('SolidColor',el('Stroke',ring,thickness=7),colorValue='FF73C9B6')

# Foreground accents stay around the silhouette, leaving the face readable.
fx=[]
for i,color in enumerate(['FF73C9B6','FFF4C86A','FFA7D8F0']):
 trail=el('Node',name=f'Colored spin trail {i}',x=512,y=570,opacity=0);a.insert(1,trail)
 curve(trail,'Orbital light arc',[((-265,5),(-265,5),(-315,-90)),((265,-10),(180,-120),(320,65)),((-110,73),(60,105),(-110,73))],7-i,color)
 fx.append(('trail',trail,i))
for i in range(10):
 star=el('Shape',name=f'Jump sparkle {i}',opacity=0);a.insert(1,star)
 el('Star',star,width=28 if i%2 else 18,height=28 if i%2 else 18,points=4,innerRadius=.23,cornerRadius=1)
 fill(star,['FFF4C86A','FF73C9B6','FFA7D8F0'][i%3]);fx.append(('spark',star,i))
for i in range(6):
 dust=el('Shape',name=f'Landing mote {i}',opacity=0);a.insert(1,dust)
 el('Ellipse',dust,width=13,height=13);fill(dust,'FFF4C86A' if i%2 else 'FF73C9B6');fx.append(('dust',dust,i))
wave=el('Shape',name='Delayed golden shockwave',x=512,y=920,opacity=0);a.insert(1,wave)
el('Ellipse',wave,width=320,height=40)
el('SolidColor',el('Stroke',wave,thickness=5),colorValue='FFF4C86A')
fx.append(('wave',wave,0))

def keyed(anim,obj,key,points,hold=False):
 channel=el('KeyedProperty',el('KeyedObject',anim,objectId=obj.get('id')),propertyKey=key)
 for frame,value in points:el('KeyFrameDouble',channel,frame=frame,value=value,interpolationType='hold' if hold else 'linear')

idle=el('LinearAnimation',a,id='0:6',name='Idle',duration=60,fps=60,loopValue='loop')
action=el('LinearAnimation',a,id='0:8',name='Jump spin and pocket laptop',duration=280,fps=60,loopValue='oneShot')
scratchTiming=json.loads((root/'src/widgets/profile-portrait/idle-scratch.json').read_text())
scratch=el('LinearAnimation',a,id='0:9',name='Idle head scratch',duration=scratchTiming['frames'],fps=scratchTiming['fps'],loopValue='oneShot')
scratchSchedule=[(0,0),(8,15),(20,16),(30,17),(40,18),(50,17),(60,18),(70,17),(80,18),(94,19),(108,20),(120,0),(126,0)]
# Exactly one illustrated pose is visible at a time.
schedule=[(0,0)]
for step in range(24):schedule.append((16+step*2,1+step%8))
schedule.extend([(64,0),(80,9),(95,10),(112,11),(130,12),(148,13),(164,14),(208,13),(220,12),(232,11),(244,10),(254,9),(268,0),(280,0)])
for i,pose in enumerate(poses):
 keyed(idle,pose,18,[(0,int(i==0)),(60,int(i==0))],True)
 keyed(scratch,pose,18,[(frame,int(i==active)) for frame,active in scratchSchedule],True)
 keyed(action,pose,18,[(frame,int(i==active)) for frame,active in schedule],True)
keyed(idle,actor,14,[(0,0),(60,0)])
keyed(scratch,actor,14,[(0,0),(126,0)])
keyed(scratch,ring,18,[(0,0),(126,0)])
keyed(action,actor,14,[(0,0),(8,10),(16,-60),(24,-140),(40,-145),(54,-90),(64,0),(70,-12),(80,0),(280,0)])
keyed(idle,ring,18,[(0,0),(60,0)])
keyed(action,ring,18,[(0,0),(62,0),(66,.65),(82,0),(280,0)])
for axis in [16,17]:
 keyed(idle,ring,axis,[(0,1),(60,1)])
 keyed(action,ring,axis,[(0,.5),(62,.5),(82,1.5),(280,1.5)])
for kind,obj,i in fx:
 keyed(idle,obj,18,[(0,0),(60,0)])
 keyed(scratch,obj,18,[(0,0),(126,0)])
 if kind=='trail':
  start=12+i*3
  keyed(action,obj,18,[(0,0),(start,0),(start+6,.85-i*.12),(53,.8-i*.12),(66,0),(280,0)])
  keyed(action,obj,15,[(0,-.2+i*.25),(start,-.2+i*.25),(58,.6+i*.25),(280,.6+i*.25)])
  keyed(action,obj,14,[(0,600-i*24),(start,600-i*24),(32,520-i*24),(60,610-i*24),(280,610-i*24)])
 elif kind=='spark':
  start=12+i*3;angle=math.tau*i/10
  keyed(action,obj,18,[(0,0),(start,0),(start+4,1),(start+20,.7),(start+28,0),(280,0)])
  keyed(action,obj,13,[(0,512+math.cos(angle)*240),(start,512+math.cos(angle)*240),(start+28,512+math.cos(angle)*340),(280,512+math.cos(angle)*340)])
  keyed(action,obj,14,[(0,460+math.sin(angle)*280),(start,460+math.sin(angle)*280),(start+28,430+math.sin(angle)*315),(280,430+math.sin(angle)*315)])
  keyed(action,obj,15,[(0,0),(start,0),(start+28,1.8),(280,1.8)])
  for axis in [16,17]:keyed(action,obj,axis,[(0,.3),(start,.3),(start+8,1.15),(start+28,.2),(280,.2)])
 elif kind=='dust':
  angle=.2+i*.55;radius=190+i%3*35
  keyed(action,obj,18,[(0,0),(62,0),(67,.9),(84,0),(280,0)])
  keyed(action,obj,13,[(0,512),(62,512),(84,512+math.cos(angle)*radius),(280,512+math.cos(angle)*radius)])
  keyed(action,obj,14,[(0,920),(62,920),(77,920-math.sin(angle)*100),(84,930-math.sin(angle)*80),(280,930-math.sin(angle)*80)])
 else:
  keyed(action,obj,18,[(0,0),(68,0),(72,.65),(88,0),(280,0)])
  for axis in [16,17]:keyed(action,obj,axis,[(0,.5),(68,.5),(88,1.8),(280,1.8)])
sm=el('StateMachine',a,id='0:7',name='Gaze');layer=el('StateMachineLayer',sm,name='Actions')
el('AnyState',layer,x=0,y=-100);el('ExitState',layer,x=300,y=-100)
el('StateTransition',el('EntryState',layer),stateToId='0:12')
states=[(0,'0:6','0:12'),(1,'0:8','0:13'),(2,'0:9','0:14')]
for index,animid,stateid in states:
 state=el('AnimationState',layer,id=stateid,animationId=animid,x=200+index*200,y=0,reset='true')
 for target,_,targetid in states:
  if target==index:continue
  transition=el('StateTransition',state,stateToId=targetid,duration=0)
  condition=el('TransitionViewModelCondition',transition,opValue='equal')
  value=el('BindablePropertyNumber',el('TransitionPropertyViewModelComparator',condition))
  bind(value,636,49)
  el('TransitionValueNumberComparator',condition,value=target)
vm=el('ViewModel',r,id='0:40',name='PortraitState',defaultInstanceId='0:41')
for prop,name in [(45,'lookX'),(46,'lookY'),(47,'eyeOpen'),(48,'eyeClosed'),(49,'action')]:el('ViewModelPropertyNumber',vm,id=f'0:{prop}',name=name)
inst=el('ViewModelInstance',vm,id='0:41',name='Default',exports='true')
for prop,value in [(45,0),(46,0),(47,1),(48,0),(49,0)]:el('ViewModelInstanceNumber',inst,viewModelPropertyId=f'0:{prop}',propertyValue=value)
ET.indent(r)
(root/'assets/profile-portrait/scene.rml').write_text(ET.tostring(r,encoding='unicode'))
# The React SVG fallback shares the exact sprite crop and placement.
(root/'src/widgets/profile-portrait/portrait-frame.json').write_text(json.dumps(meta['front']['frames'][0],indent=2)+'\n')
