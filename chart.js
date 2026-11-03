// Hand-drawn canvas line chart. No frameworks.
window.drawChart=function(cv,pts){const d=window.devicePixelRatio||1,w=cv.clientWidth,h=cv.height/ (cv._d||1);cv._d=d;cv.width=w*d;cv.height=h*d;const x=cv.getContext('2d');x.scale(d,d);x.clearRect(0,0,w,h);
if(!pts||pts.length<2){x.fillStyle='#8e8e93';x.font='13px system-ui';x.fillText('No data yet',8,h/2);return}
const ys=pts.map(p=>p[1]),mn=Math.min(...ys),mx=Math.max(...ys),r=mx-mn||1,t0=pts[0][0],tr=(pts[pts.length-1][0]-t0)||1;
const up=ys[ys.length-1]>=ys[0],c=up?'#00d35a':'#ff453a';x.beginPath();pts.forEach((p,i)=>{const px=(p[0]-t0)/tr*w,py=h-6-(p[1]-mn)/r*(h-12);i?x.lineTo(px,py):x.moveTo(px,py)});
x.strokeStyle=c;x.lineWidth=2;x.stroke();x.lineTo(w,h);x.lineTo(0,h);x.closePath();const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,c+'55');g.addColorStop(1,c+'00');x.fillStyle=g;x.fill()};
