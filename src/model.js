/* Cascadia Lab 2: spherical 2-D linear shallow water, moving Okada source.
 * Okada vertical-displacement formulas adapted from GeoClaw dtopotools.py.
 * Copyright (c) 1994-2018, Clawpack Developers. BSD-3-Clause; see LICENSE-GEOCLAW.txt.
 * This solver is independent of GeoClaw; it is not NOAA SIFT or an operational model.
 */
(function(root){'use strict';
const G=9.81,R=6371000,RAD=Math.PI/180,LM=R*RAD;
function unpack(data){const b=typeof atob==='function'?atob(data.elevation):Buffer.from(data.elevation,'base64').toString('binary');const a=new Int16Array(b.length/2);for(let i=0;i<a.length;i++){let v=b.charCodeAt(2*i)|(b.charCodeAt(2*i+1)<<8);a[i]=v;}return a;}
function gridFrom(data,factor=2){
 const z=unpack(data),nx=Math.floor(data.nx/factor),ny=Math.floor(data.ny/factor),h=new Float64Array(nx*ny),elevation=new Float32Array(nx*ny);
 for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){let v=0;for(let y=0;y<factor;y++)for(let x=0;x<factor;x++)v+=z[(j*factor+y)*data.nx+i*factor+x];v/=factor*factor;elevation[j*nx+i]=v;h[j*nx+i]=v<-20?-v:0;}
 return {nx,ny,h,elevation,lon0:data.lon0+(factor-1)*data.step/2,lat0:data.lat0+(factor-1)*data.step/2,step:data.step*factor};
}
function faultGeometry(f){const dip=f.dip*RAD,s=f.strike*RAD,ux=-f.width*Math.cos(dip)*Math.cos(s)/(LM*Math.cos(f.lat*RAD)),uy=f.width*Math.cos(dip)*Math.sin(s)/LM,sx=f.length/2*Math.sin(s)/(LM*Math.cos(f.lat*RAD)),sy=f.length/2*Math.cos(s)/LM;
 return {top:[f.lon+ux,f.lat+uy],center:[f.lon+ux/2,f.lat+uy/2],bottom:[f.lon,f.lat],corners:[[f.lon+ux+sx,f.lat+uy+sy],[f.lon+sx,f.lat+sy],[f.lon-sx,f.lat-sy],[f.lon+ux-sx,f.lat+uy-sy]],bottomDepth:f.depth+f.width*Math.sin(dip)};
}
function dipTerm(y1,y2,sn,cs,q){const db=y2*sn-q*cs,xx2=y1*y1+q*q,r=Math.sqrt(xx2+y2*y2),xx=Math.sqrt(xx2);const a5=1/cs*Math.atan((y2*(xx+q*cs)+xx*(r+xx)*sn)/(y1*(r+xx)*cs));return -(db*q/r/(r+y1)+sn*Math.atan(y1*y2/(q*r))-a5*sn*cs)/(2*Math.PI);}
function strikeTerm(y1,y2,sn,cs,q){const db=y2*sn-q*cs,r=Math.sqrt(y1*y1+y2*y2+q*q),a4=.5/cs*(Math.log(r+db)-sn*Math.log(r+y2));return -(db*q/r/(r+y2)+q*sn/(r+y2)+a4*sn)/(2*Math.PI);}
function okada(f,lon,lat){const d=f.dip*RAD,s=f.strike*RAD,rake=f.rake*RAD,depth=f.depth+f.width*Math.sin(d),xx=LM*Math.cos(lat*RAD)*(lon-f.lon),yy=LM*(lat-f.lat),x1=xx*Math.sin(s)+yy*Math.cos(s),x2=-xx*Math.cos(s)+yy*Math.sin(s),p=x2*Math.cos(d)+depth*Math.sin(d),q=x2*Math.sin(d)-depth*Math.cos(d),L=f.length/2;
 const sn=Math.sin(d),cs=Math.cos(d),integral=fn=>fn(x1+L,p,sn,cs,q)-fn(x1+L,p-f.width,sn,cs,q)-fn(x1-L,p,sn,cs,q)+fn(x1-L,p-f.width,sn,cs,q);
 const v=integral(dipTerm)*Math.sin(rake)+integral(strikeTerm)*Math.cos(rake);
 if(!Number.isFinite(v))throw Error('Non-finite elastic source');return v;
}
function scenario(data,p){
 const range={full:[56,65],north:[56,60],south:[61,65]}[p.segment]||[56,65];
 const faults=data.faults.filter(f=>f.row>=range[0]&&f.row<=range[1]).map(f=>({...f}));const nr=range[1]-range[0]+1,L=nr*100000,area=faults.reduce((v,f)=>v+f.length*f.width,0),mu=40e9,moment=10**(1.5*p.magnitude+9.1);
 const weights=faults.map(f=>{const pos=(range[1]-f.row+.5)/nr;return p.slip==='uniform'?1:Math.sin(Math.PI*pos)*(p.slip==='shallow'?(f.band==='b'?1.5:.5):1);});
 const denom=faults.reduce((v,f,i)=>v+mu*f.length*f.width*weights[i],0);
 faults.forEach((f,i)=>{f.slip=moment/denom*weights[i];f.along=(range[1]-f.row+.5)*100000;f.delay=Math.abs(f.along-L*p.hypocenter/100)/(p.ruptureSpeed*1000);f.geo=faultGeometry(f);});
 const closest=faults.filter(f=>f.band==='b').reduce((a,b)=>Math.abs(a.along-L*p.hypocenter/100)<Math.abs(b.along-L*p.hypocenter/100)?a:b);
 return {faults,moment,area,meanSlip:moment/(mu*area),maxSlip:Math.max(...faults.map(f=>f.slip)),length:L,mu,duration:Math.max(...faults.map(f=>f.delay))+p.rise,hypo:closest.geo.center};
}
const gaugeTargets=[{id:'flattery',name:'Cape Flattery',lat:48.25,lon:-124.95},{id:'westport',name:'Westport',lat:46.9,lon:-124.35},{id:'seaside',name:'Seaside',lat:46.0,lon:-124.25},{id:'newport',name:'Newport',lat:44.65,lon:-124.3},{id:'coos',name:'Coos Bay',lat:43.35,lon:-124.6},{id:'crescent',name:'Crescent City',lat:41.75,lon:-124.45}];
function gaugesFor(g){return gaugeTargets.map(t=>{let best=Infinity,index=-1;for(let j=1;j<g.ny-1;j++)for(let i=1;i<g.nx-1;i++){const k=j*g.nx+i;if(g.h[k]<100||g.h[k]>600)continue;const lat=g.lat0+j*g.step,lon=g.lon0+i*g.step,dist=((lat-t.lat)*111)**2+((lon-t.lon)*78)**2;if(dist<best){best=dist;index=k;}}if(index<0)throw Error('No offshore gauge cell');return {...t,index,lat:g.lat0+Math.floor(index/g.nx)*g.step,lon:g.lon0+(index%g.nx)*g.step,depth:g.h[index]};});}
function rise(t,delay,duration){const a=Math.max(0,Math.min(1,(t-delay)/duration));return .5-.5*Math.cos(Math.PI*a);}
class Solver{
 constructor(grid,{dt=4,sponge=true}={}){
  Object.assign(this,grid);this.dt=dt;this.t=0;const {nx,ny,h}=this,n=nx*ny;
  this.eta=new Float64Array(n);this.u=new Float64Array((nx+1)*ny);this.v=new Float64Array(nx*(ny+1));this.hx=new Float64Array(this.u.length);this.hy=new Float64Array(this.v.length);this.cos=new Float64Array(ny);this.cosv=new Float64Array(ny+1);this.dx=new Float64Array(ny);this.damp=new Float64Array(n);this.du=new Float64Array(this.u.length);this.dv=new Float64Array(this.v.length);this.dy=LM*this.step;
  let cfl=0;
  for(let j=0;j<=ny;j++)this.cosv[j]=Math.cos((this.lat0+(j-.5)*this.step)*RAD);
  for(let j=0;j<ny;j++){this.cos[j]=Math.cos((this.lat0+j*this.step)*RAD);this.dx[j]=this.dy*this.cos[j];for(let i=0;i<nx;i++){const k=j*nx+i,edge=Math.min(i*this.dx[j],(nx-1-i)*this.dx[j],j*this.dy,(ny-1-j)*this.dy);this.damp[k]=sponge?Math.exp(-dt*.012*Math.max(0,1-edge/100000)**2):1;cfl=Math.max(cfl,dt*Math.sqrt(G*h[k]*(1/this.dx[j]**2+1/this.dy**2)));}}
  this.wet=Int32Array.from({length:n},(_,k)=>k).filter(k=>h[k]);
  this.cfl=cfl;if(cfl>.9)throw Error('Time step exceeds CFL limit');
  for(let j=0;j<ny;j++)for(let i=1;i<nx;i++){const a=h[j*nx+i-1],b=h[j*nx+i];this.hx[j*(nx+1)+i]=a&&b?2*a*b/(a+b):0;this.du[j*(nx+1)+i]=Math.sqrt(this.damp[j*nx+i]*this.damp[j*nx+i-1]);}
  for(let j=1;j<ny;j++)for(let i=0;i<nx;i++){const a=h[(j-1)*nx+i],b=h[j*nx+i];this.hy[j*nx+i]=a&&b?2*a*b/(a+b):0;this.dv[j*nx+i]=Math.sqrt(this.damp[j*nx+i]*this.damp[(j-1)*nx+i]);}
 }
 advanceStep(){const {nx,ny,eta:e,u,v,h,hx,hy,du,dv,dt,dx,dy,cos,cosv,damp}=this;
  for(let j=0;j<ny;j++){const c=G*dt/dx[j];for(let i=1;i<nx;i++){const f=j*(nx+1)+i,k=j*nx+i;if(hx[f])u[f]=(u[f]-c*(e[k]-e[k-1]))*du[f];}}
  const cy=G*dt/dy;for(let k=nx;k<nx*ny;k++)if(hy[k])v[k]=(v[k]-cy*(e[k]-e[k-nx]))*dv[k];
  for(let j=0;j<ny;j++){const ax=dt/dx[j],ay=dt/(dy*cos[j]),c0=cosv[j]*ay,c1=cosv[j+1]*ay;for(let i=0;i<nx;i++){const k=j*nx+i;if(!h[k])continue;const f=j*(nx+1)+i;e[k]=(e[k]-ax*(hx[f+1]*u[f+1]-hx[f]*u[f])-(c1*hy[k+nx]*v[k+nx]-c0*hy[k]*v[k]))*damp[k];}}
  this.t+=dt;
 }
 volume(){let v=0;for(let j=0;j<this.ny;j++)for(let i=0;i<this.nx;i++)v+=this.eta[j*this.nx+i]*this.dx[j]*this.dy;return v;}
}
function createRun(data,p,options={}){
 const grid=gridFrom(data,options.factor||2),geo=scenario(data,p),solver=new Solver(grid,options),gauges=gaugesFor(grid),n=grid.nx*grid.ny;
 const fields=geo.faults.map(f=>Float32Array.from({length:n},(_,k)=>okada(f,grid.lon0+k%grid.nx*grid.step,grid.lat0+Math.floor(k/grid.nx)*grid.step)*f.slip));
 const deformation=new Float32Array(n);for(const field of fields)for(let k=0;k<n;k++)deformation[k]+=field[k];
 const peaks=new Float32Array(n),arrivals=new Float32Array(n).fill(-1),series=gauges.map(()=>[]),frames=[],frameScales=[],sample=options.sample||20,end=options.end||10800;
 let maxRatio=0;const wet=solver.wet;
 function record(){let max=.001;for(let k=0;k<n;k++)max=Math.max(max,Math.abs(solver.eta[k]));const scale=Math.max(.0005,max/32760),packed=Int16Array.from(solver.eta,v=>Math.round(v/scale));frames.push(packed);frameScales.push(scale);gauges.forEach((g,i)=>series[i].push(solver.eta[g.index]));}
 record();
 function advance(count){for(let a=0;a<count&&solver.t<end;a++){
  const t=solver.t;solver.advanceStep();for(let f=0;f<fields.length;f++){const fraction=rise(t+solver.dt,geo.faults[f].delay,p.rise)-rise(t,geo.faults[f].delay,p.rise);if(fraction===0)continue;const field=fields[f];for(let w=0;w<wet.length;w++){const k=wet[w];solver.eta[k]+=field[k]*fraction;}}
  for(let w=0;w<wet.length;w++){const k=wet[w],v=Math.abs(solver.eta[k]);if(v>peaks[k]){peaks[k]=v;if(v>maxRatio*grid.h[k])maxRatio=v/grid.h[k];}if(v>=.1&&arrivals[k]<0)arrivals[k]=solver.t;}
  if(solver.t%sample===0)record();
 }return solver.t>=end;}
 function result(){return {grid,geo,gauges,frames,frameScales,peaks,arrivals,series,deformation,sample,end,dt:solver.dt,cfl:solver.cfl,maxRatio,version:'2.1'};}
 return {advance,result,solver,fields,geo};
}
const api={G,R,LM,unpack,gridFrom,faultGeometry,okada,scenario,gaugesFor,rise,Solver,createRun};root.CascadiaModel=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
