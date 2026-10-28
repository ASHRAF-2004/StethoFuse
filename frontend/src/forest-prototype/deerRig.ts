// REJECTED 2026-10-29: photographed foreleg bends into an implausible shape.
// Historical study only; never import this rig into the forest scene.
// Texture-preserving two-bone foreleg rig. Coordinates refer to the approved 1024×1536 art.
export type Point={x:number;y:number};
export type DeerPose={head:number;ear:number;lift:number;reach:number;breath:number;playing:boolean;time:number};
export const hoof={x:316,y:1243},hip={x:351,y:900},knee={x:365,y:1035};
const clamp=(v:number,a=0,b=1)=>Math.max(a,Math.min(b,v));
const smooth=(a:number,b:number,v:number)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
const rotate=(p:Point,c:Point,a:number):Point=>({x:c.x+(p.x-c.x)*Math.cos(a)-(p.y-c.y)*Math.sin(a),y:c.y+(p.x-c.x)*Math.sin(a)+(p.y-c.y)*Math.cos(a)});

export function sampleDeerPose(time:number,idleTime=0):DeerPose{
 const playing=time>=0&&time<7.4;
 const stroke=(start:number,end:number)=>time<=start||time>=end?0:Math.sin(Math.PI*(time-start)/(end-start))**1.25;
 const paw=Math.max(stroke(.85,2.55),stroke(3.35,5.05)*.76);
 const envelope=playing?smooth(0,.8,time)*(1-smooth(6.0,7.4,time)):0;
 return {head:-.045*envelope+Math.sin(idleTime*.7)*.006,ear:playing?Math.sin(time*7)*.12*envelope:Math.sin(idleTime*1.6)**14*.09,lift:paw*88,reach:paw*38,breath:Math.sin(idleTime*1.2)*.002,playing,time};
}

function legTransforms(pose:DeerPose){
 const target={x:hoof.x-pose.reach,y:hoof.y-pose.lift};
 const l1=Math.hypot(knee.x-hip.x,knee.y-hip.y),l2=Math.hypot(hoof.x-knee.x,hoof.y-knee.y);
 const dx=target.x-hip.x,dy=target.y-hip.y,d=clamp(Math.hypot(dx,dy),Math.abs(l1-l2)+.01,l1+l2-.01),ux=dx/Math.hypot(dx,dy),uy=dy/Math.hypot(dx,dy);
 const a=(l1*l1-l2*l2+d*d)/(2*d),height=Math.sqrt(Math.max(0,l1*l1-a*a));
 const joint={x:hip.x+ux*a+uy*height,y:hip.y+uy*a-ux*height};
 return {joint,upper:Math.atan2(joint.y-hip.y,joint.x-hip.x)-Math.atan2(knee.y-hip.y,knee.x-hip.x),lower:Math.atan2(target.y-joint.y,target.x-joint.x)-Math.atan2(hoof.y-knee.y,hoof.x-knee.x)};
}
export function deformDeerPoint(p:Point,pose:DeerPose,leg=legTransforms(pose)):Point{
 let q={...p};
 const headWeight=1-smooth(540,860,p.y);
 if(headWeight>0){
  const leftEar=Math.exp(-(((p.x-238)/91)**2+((p.y-390)/70)**2))*smooth(330,375,p.y)*(1-smooth(445,475,p.y));
  const rightEar=Math.exp(-(((p.x-467)/67)**2+((p.y-422)/47)**2));
  q=rotate(q,{x:300,y:437},pose.ear*leftEar);
  q=rotate(q,{x:421,y:443},-pose.ear*.6*rightEar);
  q=rotate(q,{x:418,y:710},pose.head*headWeight);
 }
 const body=Math.exp(-(((p.y-793)/110)**2))*(1-smooth(900,980,p.y));
 q.x+=(p.x-580)*pose.breath*body;
 if(pose.lift>.001&&p.x<430&&p.y>875&&p.y<1280){
  const segment=p.y<1035?{a:hip,b:knee}:{a:knee,b:hoof};
  const dx=segment.b.x-segment.a.x,dy=segment.b.y-segment.a.y;
  const t=clamp(((p.x-segment.a.x)*dx+(p.y-segment.a.y)*dy)/(dx*dx+dy*dy));
  const dist=Math.hypot(p.x-segment.a.x-dx*t,p.y-segment.a.y-dy*t);
  const weight=(1-smooth(31,65,dist))*smooth(875,920,p.y)*(1-smooth(410,430,p.x));
  const upper=rotate(p,hip,leg.upper),lower=rotate(p,knee,leg.lower);
  lower.x+=leg.joint.x-knee.x;lower.y+=leg.joint.y-knee.y;
  const mix=smooth(1000,1072,p.y);
  q.x+=(upper.x*(1-mix)+lower.x*mix-p.x)*weight;q.y+=(upper.y*(1-mix)+lower.y*mix-p.y)*weight;
 }
 return q;
}

const legs=[
 'M343 1053 L372 1053 Q364 1134 354 1190 Q348 1221 331 1244 L304 1260 L293 1247 Q313 1217 327 1195 Q335 1158 340 1100Z',
 'M462 1053 L502 1053 Q495 1139 493 1200 Q492 1237 485 1266 L465 1298 L438 1308 L423 1294 Q440 1267 450 1240 Q459 1207 459 1160Z',
 'M695 1053 L744 1053 Q717 1128 685 1186 Q674 1218 650 1243 L620 1264 L598 1253 L611 1230 Q635 1206 653 1174 Q681 1120 695 1053Z',
 'M853 1053 L901 1053 Q912 1129 923 1212 L923 1278 L908 1316 L875 1324 L856 1309 Q867 1279 866 1245 Q868 1192 858 1136Z',
];
export function makeDeerLayers(image:HTMLImageElement,bank:HTMLImageElement){
 const make=()=>{const c=document.createElement('canvas');c.width=1024;c.height=1536;return c;};
 const mask=make(),mc=mask.getContext('2d')!;mc.fillStyle='#fff';mc.fillRect(0,0,1024,1058);for(const d of legs)mc.fill(new Path2D(d));
 // The ground is a stationary plate. Only tiny areas revealed by a lifted hoof
 // use the matching existing moss-bank texture; the original island stays intact.
 const island=make(),ic=island.getContext('2d')!;ic.drawImage(image,0,1058,1024,478,0,1058,1024,478);ic.globalCompositeOperation='destination-out';ic.drawImage(mask,0,0);
 const patch=make(),pc=patch.getContext('2d')!;pc.save();pc.beginPath();pc.rect(0,1058,1024,478);pc.clip();for(const d of legs){pc.save();pc.clip(new Path2D(d));pc.drawImage(bank,500,260,1200,400,0,1000,1200,400);pc.restore();}pc.restore();pc.drawImage(island,0,0);
 return {mask,ground:patch};
}

export function createDeerRig(image:HTMLImageElement,mask:HTMLCanvasElement){
 const canvas=document.createElement('canvas');canvas.width=512;canvas.height=768;
 const gl=canvas.getContext('webgl2',{alpha:true,antialias:true,premultipliedAlpha:true});if(!gl)throw new Error('WebGL2 unavailable');
 const shader=(type:number,source:string)=>{const s=gl.createShader(type)!;gl.shaderSource(s,source);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s)||'Deer shader');return s;};
 const vs=shader(gl.VERTEX_SHADER,'#version 300 es\nin vec2 aPosition;in vec2 aUV;out vec2 uv;void main(){uv=aUV;gl_Position=vec4(aPosition,0.,1.);}');
 const fs=shader(gl.FRAGMENT_SHADER,'#version 300 es\nprecision mediump float;in vec2 uv;uniform sampler2D art;uniform sampler2D matte;out vec4 color;void main(){vec4 c=texture(art,uv);float m=texture(matte,uv).a;color=vec4(c.rgb*m,c.a*m);}');
 const program=gl.createProgram()!;gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Deer shader link');gl.useProgram(program);
 const textures:WebGLTexture[]=[];
 for(const [i,source] of [image,mask].entries()){
  const upload=document.createElement('canvas');upload.width=512;upload.height=768;upload.getContext('2d')!.drawImage(source,0,0,512,768);
  const texture=gl.createTexture()!;textures.push(texture);gl.activeTexture(gl.TEXTURE0+i);gl.bindTexture(gl.TEXTURE_2D,texture);gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,upload);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);gl.uniform1i(gl.getUniformLocation(program,i?'matte':'art'),i);
 }
 const columns=64,rows=96,positions:Point[]=[],data=new Float32Array((columns+1)*(rows+1)*4),indices:number[]=[];
 for(let y=0;y<=rows;y++)for(let x=0;x<=columns;x++){positions.push({x:x/columns*1024,y:y/rows*1536});const i=(y*(columns+1)+x)*4;data[i+2]=x/columns;data[i+3]=y/rows;}
 for(let y=0;y<rows;y++)for(let x=0;x<columns;x++){const a=y*(columns+1)+x,b=a+1,c=a+columns+1,d=c+1;indices.push(a,c,b,b,c,d);}
 const vertices=gl.createBuffer()!,elements=gl.createBuffer()!;gl.bindBuffer(gl.ARRAY_BUFFER,vertices);gl.bufferData(gl.ARRAY_BUFFER,data.byteLength,gl.DYNAMIC_DRAW);gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,elements);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Uint16Array(indices),gl.STATIC_DRAW);
 for(const [name,offset] of [['aPosition',0],['aUV',8]] as const){const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,2,gl.FLOAT,false,16,offset);}
 return {canvas,draw(pose:DeerPose){const leg=legTransforms(pose);for(let i=0;i<positions.length;i++){const p=deformDeerPoint(positions[i],pose,leg);data[i*4]=p.x/512-1;data[i*4+1]=1-p.y/768;}gl.bindBuffer(gl.ARRAY_BUFFER,vertices);gl.bufferSubData(gl.ARRAY_BUFFER,0,data);gl.viewport(0,0,512,768);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawElements(gl.TRIANGLES,indices.length,gl.UNSIGNED_SHORT,0);},dispose(){for(const t of textures)gl.deleteTexture(t);gl.deleteBuffer(vertices);gl.deleteBuffer(elements);gl.deleteProgram(program);gl.deleteShader(vs);gl.deleteShader(fs);gl.getExtension('WEBGL_lose_context')?.loseContext();}};
}
