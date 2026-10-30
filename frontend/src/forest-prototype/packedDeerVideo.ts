/** RGB and coverage share one decoded frame, keeping the two planes registered. */
export function createPackedDeerVideo(canvas:HTMLCanvasElement,video:HTMLVideoElement){
  const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:false,preserveDrawingBuffer:false});
  if(!gl)throw new Error('Video surface unavailable');
  const shader=(type:number,source:string)=>{
    const result=gl.createShader(type);if(!result)throw new Error('Shader unavailable');
    gl.shaderSource(result,source);gl.compileShader(result);
    if(!gl.getShaderParameter(result,gl.COMPILE_STATUS)){gl.deleteShader(result);throw new Error('Shader compilation failed');}
    return result;
  };
  const vertex=shader(gl.VERTEX_SHADER,'attribute vec2 position;varying vec2 uv;void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}');
  const fragment=shader(gl.FRAGMENT_SHADER,'precision mediump float;uniform sampler2D movie;varying vec2 uv;void main(){vec3 rgb=texture2D(movie,vec2(uv.x*.5,uv.y)).rgb;float a=texture2D(movie,vec2(.5+uv.x*.5,uv.y)).r;gl_FragColor=vec4(rgb*a,a);}');
  const program=gl.createProgram(),buffer=gl.createBuffer(),texture=gl.createTexture();
  if(!program||!buffer||!texture)throw new Error('Video resources unavailable');
  gl.attachShader(program,vertex);gl.attachShader(program,fragment);gl.linkProgram(program);
  if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Video program unavailable');
  gl.useProgram(program);gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,1);gl.uniform1i(gl.getUniformLocation(program,'movie'),0);
  gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1120,840,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
  canvas.width=560;canvas.height=840;gl.viewport(0,0,560,840);
  return {
    draw(){
      if(video.readyState<2)return false;
      if(video.videoWidth!==1120||video.videoHeight!==840)throw new Error('Video registration changed');
      gl.bindTexture(gl.TEXTURE_2D,texture);gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,gl.RGBA,gl.UNSIGNED_BYTE,video);
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);return true;
    },
    dispose(){gl.deleteTexture(texture);gl.deleteBuffer(buffer);gl.deleteProgram(program);gl.deleteShader(vertex);gl.deleteShader(fragment);}
  };
}
