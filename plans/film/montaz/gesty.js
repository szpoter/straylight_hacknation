// Local bends keep the ink, sleeve and paper together at the contact point.
export function createRig(images) {
  const canvas=document.createElement("canvas");
  canvas.width=1920;canvas.height=1080;
  const gl=canvas.getContext("webgl",{alpha:false,antialias:false,preserveDrawingBuffer:true});
  if(!gl)throw Error("WebGL is required to render the character poses");
  const program=gl.createProgram();
  for(const [kind,source] of [[gl.VERTEX_SHADER,`
    attribute vec2 pos; varying vec2 uv;
    void main(){uv=vec2(pos.x*.5+.5,.5-pos.y*.5);gl_Position=vec4(pos,0.,1.);}`],
    [gl.FRAGMENT_SHADER,`precision highp float;
    uniform sampler2D art;
    uniform vec4 pose[5]; uniform vec2 radius[5];
    varying vec2 uv;
    void main(){vec2 offset=vec2(0.);
      for(int i=0;i<5;i++){
        vec2 d=(uv-pose[i].xy)/radius[i];
        float weight=exp(-dot(d,d)*2.);
        offset+=pose[i].zw*weight;
      }
      gl_FragColor=texture2D(art,clamp(uv-offset,0.,1.));}`]]){
    const shader=gl.createShader(kind);gl.shaderSource(shader,source);gl.compileShader(shader);
    if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(shader));
    gl.attachShader(program,shader);
  }
  gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(program));
  gl.useProgram(program);const buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const pos=gl.getAttribLocation(program,"pos");gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
  const pose=gl.getUniformLocation(program,"pose[0]"),radius=gl.getUniformLocation(program,"radius[0]");
  const textures={};
  for(const [key,img] of Object.entries(images)){
    const tex=gl.createTexture();textures[key]=tex;gl.bindTexture(gl.TEXTURE_2D,tex);
    for(const dir of [gl.TEXTURE_WRAP_S,gl.TEXTURE_WRAP_T])gl.texParameteri(gl.TEXTURE_2D,dir,gl.CLAMP_TO_EDGE);
    for(const filter of [gl.TEXTURE_MIN_FILTER,gl.TEXTURE_MAG_FILTER])gl.texParameteri(gl.TEXTURE_2D,filter,gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,img);
  }
  const ramp=(t,a,b)=>{const p=Math.max(0,Math.min(1,(t-a)/(b-a)));return p*p*(3-2*p)};
  return (key,t,voice)=>{
    const moves=[];
    const move=(x,y,dx,dy,rx,ry)=>moves.push([x,y,dx/1280,dy/720,rx,ry]);
    const breathe=Math.sin(t*2.2), nod=Math.sin(t*3.1);
    if(key==="birth"){
      const reach=(1-ramp(t,0,1.7))*24,close=Math.sin(Math.PI*ramp(t,1.0,2.8));
      move(.64,.61,reach,-reach*.23,.28,.21);move(.525,.635,-close*9,close*4,.061,.070);
      move(.30,.45,0,2.5*breathe*(1-ramp(t,2.7,3.7)),.2,.36);
    }else if(key==="queue"){
      const turn=Math.sin(Math.PI*ramp(t,9.72,11.48)),roll=Math.sin(t*1.5);
      move(.27,.69,7*roll,1.5*breathe,.24,.36);
      move(.418,.405,-turn*15,-turn*24,.090,.17);
      move(.234,.247,1.7*nod,1.9*breathe,.13,.17);
      move(.236,.311,0,voice.marta*3,.036,.032);
      move(.432,.246,0,voice.pawel*3,.032,.038);
    }else if(key==="pair"){
      const look=ramp(t,13.4,14.7);
      move(.278,.312,look*7,-look*12,.16,.24);move(.36,.389,voice.marta*2,voice.marta*4,.028,.028);
      move(.392,.573,-nod*2,-look*12,.072,.075);move(.762,.34,-4*nod,voice.pawel*4,.13,.14);
      move(.73,.495,-7*ramp(t,16.3,17.1),-5*breathe,.09,.12);
    }else if(key==="window"){
      const point=Math.sin(Math.PI*ramp(t,23.4,25.85));
      move(.60,.65,point*13,point*10,.116,.19);move(.747,.753,point*7,point*3,.20,.20);
      move(.738,.328,0,2*nod,.13,.17);move(.748,.428,0,voice.pracownica*4,.046,.042);
    }else if(key==="sofa"){
      const release=ramp(t,32.1,33.65);
      move(.871,.631,4*release,-14*Math.sin(Math.PI*release),.12,.23);
      move(.704,.529,-7*release,-3*nod,.11,.12);move(.453,.31,0,voice.marta*3,.052,.044);
      move(.685,.292,0,voice.pawel*3,.047,.043);
    }else if(key==="elbow"){
      const lean=Math.sin(Math.PI*ramp(t,34.02,35.98));
      move(.65,.334,-11*lean,9*lean,.16,.22);move(.74,.528,-18*lean,2*lean,.095,.11);
      move(.608,.535,-5*lean,8*lean,.08,.10);
    }
    while(moves.length<5)move(0,0,0,0,1,1);
    gl.bindTexture(gl.TEXTURE_2D,textures[key]);
    gl.uniform4fv(pose,new Float32Array(moves.flatMap(m=>m.slice(0,4))));
    gl.uniform2fv(radius,new Float32Array(moves.flatMap(m=>m.slice(4))));
    gl.drawArrays(gl.TRIANGLE_STRIP,0,4);return canvas;
  };
}
