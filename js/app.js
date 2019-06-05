var SIDI ={};
!function (e) {
    class t extends Backbone.Model{
        onRAF(t){
            let r = t.delta / 1e2;
            this.time += r;
            let delta = this.clock.getDelta();
            this.trigger('draw', this.time, r);
            this.mixers.forEach(mixer=>{
                mixer.update(delta);
            });
            if(this.markers[0].visible && this.markers[1].visible){
                //Get position in marker 1
                let cur = new THREE.Vector3();
                let des = new THREE.Vector3();

                this.markers[0].getWorldPosition(cur);
                this.markers[1].getWorldPosition(des);
                des.sub(cur);

                this.characters[0].position.add(des.multiplyScalar(0.002));


            }
            this.renderer.render(this.scene, this.camera);

        }
        registerAnimation(){
            createjs.Ticker.addEventListener('tick', this.onRAF, false);

        }
        init(){
            this.time = 0;
            this.clock = new THREE.Clock();
            this.markers =[];
            this.characters =[];
            this.onRAF = this.onRAF.bind(this);
            this.renderer	= new THREE.WebGLRenderer({
                antialias	: true,
                alpha: true
            });
            this.renderer.setClearColor(new THREE.Color('lightgrey'), 0);
            this.renderer.setPixelRatio( 1/2 );
            this.renderer.setSize( window.innerWidth, window.innerHeight );
            this.renderer.domElement.style.position = 'absolute';
            this.renderer.domElement.style.top = '0px';
            this.renderer.domElement.style.left = '0px';
            document.body.appendChild( this.renderer.domElement );
            let light = new THREE.AmbientLight(0xffffff, 1);

            this.scene	= new THREE.Scene();
            this.camera = new THREE.Camera();
            this.scene.add(this.camera);
            this.scene.add(light);
            this.arToolkitSource = new THREEx.ArToolkitSource({
                sourceType : 'webcam'
            });
            this.arToolkitSource.init(()=>{
                this.onResize()
            });

            // handle resize
            window.addEventListener('resize', ()=>{
                this.onResize()
            });
            this.arToolkitContext = new THREEx.ArToolkitContext({
                cameraParametersUrl: './data/camera_para.dat',
                detectionMode: 'mono',
                maxDetectionRate: 30,
                canvasWidth: 80*3,
                canvasHeight: 60*3,
            });
            this.arToolkitContext.init(()=>{
                this.camera.projectionMatrix.copy( this.arToolkitContext.getProjectionMatrix() );
            });


            this.loader = new THREE.JSONLoader();
            this.action ={};
            this.loader.load('model/eva-animated.json',(geometry, materials)=>{

                materials.forEach(function (material) {
                    material.skinning = true;
                });
                this.character = new THREE.SkinnedMesh(
                    geometry,
                    new THREE.MeshFaceMaterial(materials)
                );

                this.trigger('model_ready');
            });

            this.on('model_ready',()=>{
                console.log("Model is ready.");
                console.log(this.mixer)
                this.registerAnimation();
                this.createMarkerControls();
            })
        }

        onResize(){
            this.arToolkitSource.onResize()
            this.arToolkitSource.copySizeTo(this.renderer.domElement)
            if( this.arToolkitContext.arController !== null ){
                this.arToolkitSource.copySizeTo(this.arToolkitContext.arController.canvas)
            }
        }
        updateArtoolkit(){
            if ( this.arToolkitSource.ready !== false )
                this.arToolkitContext.update( this.arToolkitSource.domElement );
        }
        createMarkerControls(){
            let markers =[
                'hiro.patt',
                'kanji.patt',
                'letterA.patt',
                'letterB.patt',
                'letterC.patt',
                'letterD.patt',
                'letterF.patt'
            ];
            this.mixers =[];
            for(let i=0;i<markers.length;i++){
                let _group = new THREE.Group();
                _group.name =markers[i];
                let _control = new THREEx.ArMarkerControls(this.arToolkitContext, _group, {
                    type : 'pattern',
                    patternUrl : `data/${markers[i]}`
                });
                let cubeGeo = new THREE.CubeGeometry(1.25,1.25,1.25);
                let cubeMat = new THREE.MeshBasicMaterial({color:'red'});
                // _group.add(new THREE.Mesh(cubeGeo,cubeMat));
                // let model = this.model.clone();
                let c = this.character.clone();
                c.name=markers[i];
                let mixer = new THREE.AnimationMixer(c);
                let action ={};
                action.hello = mixer.clipAction(c.geometry.animations[ 0 ]);
                action.idle = mixer.clipAction(c.geometry.animations[ 1 ]);
                action.run = mixer.clipAction(c.geometry.animations[ 3 ]);
                action.walk = mixer.clipAction(c.geometry.animations[ 4 ]);

                action.hello.setEffectiveWeight(1);
                action.idle.setEffectiveWeight(1);
                action.run.setEffectiveWeight(1);
                action.walk.setEffectiveWeight(1);
                action.walk.setLoop(THREE.LoopRepeat);
                action.hello.setLoop(THREE.LoopOnce, 0);
                action.hello.clampWhenFinished = true;

                action.hello.enabled = true;
                action.idle.enabled = true;
                action.run.enabled = true;
                action.walk.enabled = true;
                action.walk.play();
                 _group.add(c);
                this.mixers.push(mixer);
                this.scene.add(_group);
                this.markers.push(_group);
                this.characters.push(c);
            }
            this.on('draw', this.updateArtoolkit);
        }
    }
    e.index = new t();
}(SIDI ||(SIDI={}));
SIDI.index.init();