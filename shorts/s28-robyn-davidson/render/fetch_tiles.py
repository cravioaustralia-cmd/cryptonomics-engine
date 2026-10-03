import math, os, sys, concurrent.futures as cf, urllib.request
def tx(lon,z): return (lon+180)/360*2**z
def ty(lat,z): r=math.radians(lat); return (1-math.log(math.tan(r)+1/math.cos(r))/math.pi)/2*2**z
def job(z,x,y):
    p=f'tiles/{z}_{x}_{y}.png'
    if os.path.exists(p): return
    u=f'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
    for k in range(4):
        try: urllib.request.urlretrieve(u,p); return
        except Exception as e: err=e
    print('fail',u,err)
z,lon0,lon1,lat0,lat1=int(sys.argv[1]),*map(float,sys.argv[2:6])
xs=range(int(tx(lon0,z)),int(tx(lon1,z))+1); ys=range(int(ty(lat1,z)),int(ty(lat0,z))+1)
jobs=[(z,x,y) for x in xs for y in ys]; print(len(jobs))
with cf.ThreadPoolExecutor(16) as ex: list(ex.map(lambda a: job(*a), jobs))
