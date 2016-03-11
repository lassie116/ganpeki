(function(){
     "use strict";

     //// Model
     var Model = make_model();

     // Model Object function
     function make_model(){
         var self = {};
         self.get = get;
         self.set_map = set_map;
         self.set_m = set_m;
         self.is_finish = is_finish;
         self.is_valid_move = is_valid_move;
         self.move_to = move_to;
         self.can_move = can_move;
         self.calc_dir = calc_dir;

         var field = [];
         var guard_sym = "b";
         var m_pos = {x:0,y:0};         
         var next_valid_pos = [];
         var _dir = 3;

         self.field = field;
         self.m_pos = m_pos;
         self.next_valid_pos = function() {return next_valid_pos;};
         self.dir = function() {return _dir;}

         function calc_dir(from,to){
             if (from.x == to.x) {
                 return (to.y < from.y) ? 0 : 3;
             } else if (from.y == to.y) {
                 return (to.x < from.x) ? 2 : 1;
             } else {
                 console.log("invalid dir move?");
             }
         }
         
         function can_move(){
             return (next_valid_pos.length > 0);
         }

         function set_m(pos){
             m_pos.x = pos.x;
             m_pos.y = pos.y;
         }

         function move_to(pos){
             next_valid_pos = make_valid_pos(pos);
             _dir = calc_dir(m_pos,pos);
             set(m_pos,"0"); //remove_gake
             set_m(pos);
         }
         
         function is_valid_move(pos){
             return _is_valid_move(pos,next_valid_pos);
         }

         function _is_valid_move(pos,valid_list){
             for (var i = 0;i<valid_list.length;i++){
                 var v_pos = valid_list[i][0];
                 if (pos.x == v_pos.x && pos.y == v_pos.y) return true;
             }
             return false;
         }

         function make_valid_pos(to){
             if (to == undefined) { to = m_pos; }
             var from = m_pos;
             var ret = [];
             var diff_list = [{x:0,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0}];
             var dir_names = "nswe";
             for (var i = 0;i<4;i++){
                 var diff = diff_list[i];
                 
                 var tx = to.x + diff.x;
                 var ty = to.y + diff.y;
                 
                 for (;;){
                     if (ty == m_pos.y && tx == m_pos.x) {
                         break;
                     }
                     var c = get({x:tx,y:ty});
                     if (c == guard_sym) break;
                     if (c == "1") {
                         ret.push([{x:tx,y:ty},dir_names[i]]);
                         break;
                     }
                     tx += diff.x;
                     ty += diff.y;
                 }
             }
             return ret;
         }

         function make_valid_pos_old(to){
             if (to == undefined) { to = m_pos; }
             var from = m_pos;
             var ret = [];
             var diff_list = [{x:0,y:-1},{x:0,y:1},{x:-1,y:0},{x:1,y:0}];
             
             for (var i = 0;i<4;i++){
                 var diff = diff_list[i];
                 
                 var tx = to.x + diff.x;
                 var ty = to.y + diff.y;
                 
                 for (;;){
                     if (ty == m_pos.y && tx == m_pos.x) {
                         break;
                     }
                     var c = get({x:tx,y:ty});
                     if (c == guard_sym) break;
                     if (c == "1") {
                         ret.push({x:tx,y:ty});
                         break;
                     }
                     tx += diff.x;
                     ty += diff.y;
                 }
             }
             return ret;
         }

         function is_finish(n){
             if (n == undefined) n = 1;
             
             var rest = 0;
             for (var y = 0;y<bsize;y++){
                 for (var x = 0;x<bsize;x++){
                     if (get({x:x,y:y}) == "1") {
                         rest += 1;
                         if (rest > n) return false;
                     }
                 }
             }
             return true;
         }

         function set(pos,sym){
             field[pos.y+1][pos.x+1] = sym;
         }
         
         function get(pos){
             return field[pos.y+1][pos.x+1];
         }
         
         function set_map(map){
             // set guard
             _dir = 3;
             var guard = [];
             for (var i = 0;i<bsize+2;i++){
                 guard.push(guard_sym);
             }
             
             field = [guard];
             
             for (var y = 0;y<bsize;y++){
                 field[y+1] = [];
                 
                 field[y+1].push(guard_sym);
                 for (var x = 0;x<bsize;x++){
                     var cell = map[y][x];
                     if (cell == "S") {
                         var t_cell = {x:x,y:y};
                         set(t_cell,"1");
                         set_m(t_cell);
                     } else {
                         var cell2 = "1";
                         if (cell === "0") {
                             cell2 = "0"
                         }
                         set({x:x,y:y},cell2);
                     }
                 }
                 field[y+1].push(guard_sym);
             }
             field.push(guard);
             next_valid_pos = make_valid_pos();
             return field;
         }
         
         return self;
     }


     //// View

     var View = make_view(Model);

     // View Object function
     function make_view(model){
         var self = {};
         self.image_cache = image_cache;
         self.draw_all = draw_all;
         self.display_menu = display_menu;
         self.display_game = display_game;
         self.register_handlers = register_handlers;
         self.status = status;
         self.stage = stage;
         self.time = time;
         self.player_anime_start = player_anime_start;
         self.gake_anime_start = gake_anime_start;
         self.refresh_gake = refresh_gake;
         self.draw_gake = draw_gake;
         self.clear_arrow = clear_arrow;

         var on_anime;
         var obj_id = "#board";
         var player_id = "#player";
         var player_offset_y = 48;
         var player_offset_x = 0;
         var current_gake;
         var stop_gake_anime;

         var audio_jump = new Audio("./sound/jump.wav");
         audio_jump.volume = 0.2;
         function play_jump(){
             audio_jump.play();
         }

         // news
         var image_list = ["back","right","left",""];

         function image_cache(){
             var i = 0;
             setTimeout(step1,50);
             play_jump();
             function step1() {
                 change_image($('#player')[0],"chara" + image_list[i]);
                 setTimeout(step2,50);
             }

             function step2() {
                 change_image($('#player')[0],"jump" + image_list[i] + "01");
                 setTimeout(step3,50);
             }

             function step3() {
                 change_image($('#player')[0],"jump" + image_list[i] + "02");
                 i += 1;
                 if (i < image_list.length) setTimeout(step1,50);
             }
         }

         function player_anime_start(from,to,callback){
             play_jump();
             on_anime = true;
             var obj = $(player_id)[0];
             
             var from_XY = calc_XY(from);
             var to_XY = calc_XY(to);
         
             var dist = (Math.abs(to.x - from.x) + Math.abs(to.y - from.y));
             var v0 = 10 + 2 * dist;
             var limit = 5 + dist;
             var a = (v0 * 2) / limit;
             var diff_x = (to_XY.x - from_XY.x) / limit;
             var diff_y = (to_XY.y - from_XY.y) / limit;
             
             var dir = model.calc_dir(from,to);
             //var image_name = "./image/jump" + image_list[dir];
             var image_name = "jump" + image_list[dir];
             
             var jump_y = 0;
             var cycle = 0;
             function step(){
                 if (cycle == limit) {
                     on_anime = false;
                     callback();
                     return;
                 }
                 
                 jump_y += (v0 - (cycle * a));
                 var x = from_XY.x + diff_x * cycle - player_offset_x;
                 var y = from_XY.y + diff_y * cycle - player_offset_y - jump_y;

                 var no = (cycle < (limit / 2)) ? "01" : "02";
                 /*
                 obj.firstChild.src = image_name + no + ".png";
                  */
                 change_image(obj,image_name + no);
                 draw_obj(obj,{x:x,y:y});
                 
                 cycle += 1;
                 setTimeout(step,40);
             }

             step();
         }

         function gake_anime_start(callback,gameover){
             var count = 0;
             var stop = false;
             stop_gake_anime = function(){stop = true};
             setTimeout(step,60);
             function step(){
                 if (stop) return;
                 
                 if (gameover){
                     var obj = $(player_id)[0];
                     var draw_XY = calc_XY(model.m_pos);
                     draw_XY.y += 100 * count;
                     draw_obj(obj,draw_XY);
                 }

                 change_image(current_gake,"gake_crash_"+count);
                 if (count < 3) {
                     count += 1
                     setTimeout(step,80);
                 } else {
                     callback();
                 }
             }
             
         }

         function time(log){
             $('#time')[0].textContent = log;
         }

         function status(log){
             $('#status')[0].innerHTML = "&emsp;" + log;
         }
         
         function stage(log){
             $('#stage')[0].innerHTML = "&emsp;" + log;
         }

         function add_classname(element, cName) {
             var regexp = new RegExp("(^|\\s)" + cName + "(\\s|$)");
             
             if (element && !regexp.test(element.className)) {
                 cName = element.className + " " + cName;
                 element.className = cName.replace(/^\s+|\s+$/g, "");
             }
         }
         
         var image_prefix = "image_"
         function change_image(element,cName){
             var r = new RegExp("(^|\\s)" + image_prefix + "[^\\s]+(\\s|$)");
             if (element) {
                 var temp = element.className.replace(r, " ");
                 element.className = temp.replace(/^\s+|\s+$/g, "");
                 add_classname(element,image_prefix+cName);
             }
         }

         function remove_classname(element, cName) {
             var r = new RegExp("(^|\\s)" + cName + "(\\s|$)");
             
             if (element) {
                 cName = element.className.replace(r, " ");
                 element.className = cName.replace(/^\s+|\s+$/g, "");
             }
         }
         
         function draw_all(){
             draw_field(model.field,model.next_valid_pos(),obj_id);
             draw_arrow(model.m_pos,model.next_valid_pos(),obj_id);
             draw_player(player_id);
         }

         function draw_field(field,next_valid_pos,obj_id){
             var div = $(obj_id)[0];
             var div_list = div.getElementsByClassName("gake");
             
	     for (var i = 0;i < div_list.length;++i){
	         var obj = div_list[i];
	         var pos = get_pos(obj);
                 var XY = calc_XY(pos);
                 draw_obj(obj,XY);
                 change_image(obj,"gake");
                 for (var j = 0;j<next_valid_pos.length;j++){
                     var np = next_valid_pos[j][0];
                     if (np.x == pos.x & np.y == pos.y) {
                         change_image(obj,"gake_focus");
                         break;
                     }
                 }
                 switch (model.get(pos)){
                 case "0":
                     obj.style.display="none";
                     break;
                 case "1":
                     obj.style.display="block";
                     break;
                 }
             }
         }

         function clear_arrow(){
             var div_list = $(obj_id + " .arrow");
             div_list.hide();
         }

         function draw_arrow(m_pos,next_valid_pos,obj_id){
             var div_list = $(obj_id + " .arrow");
             div_list.hide();
             var diff_list = {n:{x:7 + 1,y:-field_yunit/2-6},
                              s:{x:-5 + 1,y:field_yunit/2+6},
                              w:{x:-field_xunit/2-11 + 1,y:0},
                              e:{x:+field_xunit/2+11 + 1,y:0}}

             for (var i = 0;i < next_valid_pos.length;++i){
                 var ar_id = next_valid_pos[i][1];
                 var obj = $("#a" + ar_id);
                 var XY = calc_XY(m_pos);
                 XY.x += diff_list[ar_id].x;
                 XY.y += diff_list[ar_id].y;
                 obj.show();
                 draw_obj(obj[0],XY);
             }
         }

         function search_current_gake(){
             var m_pos = model.m_pos;
             var div_list = document.getElementsByClassName("gake");
             for (var i = 0;i < div_list.length;++i){
	         var obj = div_list[i];
	         var pos = get_pos(obj);
                 if (pos.x == m_pos.x && pos.y == m_pos.y) return obj;
             }
         }

         function refresh_gake(){
             current_gake = search_current_gake();
         }

         function draw_gake(rest_time){
             if (rest_time > 6) {
                 change_image(current_gake,"gake");
                 return;
             }
             change_image(current_gake,"gake_" + rest_time);
         }


         function draw_obj(obj,XY){
             obj.style.left = XY.x;
             obj.style.top = XY.y;
         }
         
         function draw_player(player_id){
             var obj = $(player_id)[0];
             var draw_XY = calc_XY(model.m_pos);
             draw_XY.x -= player_offset_x;
             draw_XY.y -= player_offset_y;
             /*
             obj.firstChild.src = 
                 "./image/chara" + image_list[model.dir()] + ".png";
              */
             change_image(obj,"chara"+image_list[model.dir()])
             draw_obj(obj,draw_XY);
         }

         var field_xunit = 64 - 8;
         var field_yunit = 33;
         var diff = 10;

         function mouseXY2pos(pos){
             var x = pos.x;
             var y = pos.y;
             var board = $(obj_id)[0];
             var basey = 64;
             var posy = Math.floor((y - basey) / field_yunit);
             var basex = board.offsetLeft + (8-posy) * diff;
             var posx = Math.floor((x - basex) / field_xunit);
             return {x:posx,y:posy};
         }

         function calc_XY(pos){
             var left = pos.x * field_xunit + (8-pos.y) * diff;
             var top = pos.y * field_yunit + 64;
             return {x:left,y:top};
         }
         
         function display_menu(flag){
             if (!flag) {
                 $("#board")[0].style.display = "none";
             }

             $("#time")[0].style.display = "none";
             $('#status')[0].style.display = "none";
             $('#menu')[0].style.display = "inline";
             if (flag === true) {
                 $('#retry')[0].style.display = "none";
                 $('#next_game')[0].style.display = "none";
             } else {
                 $('#retry')[0].style.display = "inline";
                 $('#next_game')[0].style.display = "inline";
             }
         }

         function display_game(){
             $(obj_id).show();
             $('#status').show();
             $("#time").show();
             $('#menu').hide();
             if (stop_gake_anime) stop_gake_anime();
         }

         function is_valid_pos(pos){
             return (pos.x >= 0 && pos.x < bsize &&
                     pos.y >= 0 && pos.y < bsize);
         }

         function onclick_handler(ev){
             var rect = $(obj_id)[0].getBoundingClientRect();
             var offsetXY = {x:ev.clientX - rect.left,
                             y:ev.clientY - rect.top};
             var pos = mouseXY2pos(offsetXY);
             if (is_valid_pos(pos)){
                 move_to(pos);
             }
         }

         function get_pos(obj){
	     var x = parseInt(val(obj,'x'));
	     var y = parseInt(val(obj,'y'));
	     return {x:x,y:y};
             
	     function val(obj,name){
                 if (obj.attributes[name] == undefined) {return "-2";}
	         return obj.attributes[name].nodeValue;
	     }
         }
         
         function register_handlers(){
             $("#board").click(onclick_handler);
             $('#play_first').click(play_first);
             $('#play_random').click(play_random);
             $('#retry').click(play_start);
             $('#next_game').click(next_game);
         }

         return self;
     }


     //// Controller

     // const

     var bsize = 9;
     window.onload = init;
     var stop_timer;
     var current_stage = 0;
     var limit = 10;
     var map_info;
     var falling = false;
     
     function init(){
         View.image_cache();
         View.display_menu(true);
         View.register_handlers();
         current_stage = 0;
         update_map_info();
     }

     function move_to(pos){
         if (falling) return;
         if (Model.is_valid_move(pos)){
             stop_timer();
             View.clear_arrow();
             View.player_anime_start(Model.m_pos,pos,check_state);
             View.gake_anime_start(function(){
                                       View.refresh_gake();
                                   });
             Model.move_to(pos);
             // View.refresh_gake();
         } else {
             View.status("そこには動けないよ");
         }

         function check_state(){
             View.draw_all();
             if (Model.is_finish()) {
                 alert("クリア!!\n次の面に進みます");
                 View.display_menu();
                 next_game();
             } else if (Model.can_move()) {
                 View.status("");
                 stop_timer = start_timer(limit);
             } else {
                 View.status("詰んだ");
                 gameover("詰んだ");
             }
         }
     }

     function play_first(){
         current_stage = 0;
         update_map_info();
         play_start();
     }

     function play_random(){
         current_stage = undefined;
         update_map_info();
         play_start();
     }
     
     function next_game(){
         succ_stage();
         update_map_info();
         play_start();
     }

     function update_map_info(){
         var no = current_stage;
         if (no == undefined){
             map_info = {name:"ランダム面",map:generate_map()};
         } else {
             map_info = Map.list[no];
         }
     }

     function succ_stage(){
         if (current_stage != undefined) {
             current_stage += 1;
             if (Map.list.length == current_stage){
                 current_stage = undefined;
             }
         }
     }

     function play_start(){
         Model.set_map(map_info.map);
         if (map_info.name != undefined) {
             View.stage("ステージ " + map_info.name);
         } else {
             View.stage("ステージ " + (current_stage - 2));
         }
         View.status("スタート");
         View.display_game();
         View.draw_all();
         View.refresh_gake();
         falling = false;
         stop_timer = start_timer(limit);
     }

     function gameover(mes) {
         View.draw_all();
         View.display_menu();
         alert(mes);
     }

     function start_timer(n){
         var now = n;
         var state = "go";
         function step(){
             if (state == "stop") return;
             View.time("のこり" + now + "秒");
             if (now == 0) {
                 falling = true;
                 View.gake_anime_start(
                     function(){
                         setTimeout(step,500);
                         function step(){
                             gameover("時間切れでシズンジャッタ");
                         }
                     },true
                 );
             } else {
                 View.draw_gake(now);
                 now -= 1;
                 setTimeout(step,1000);
             }
         }
         
         function stop(){
             state = "stop";
         }
         step(n);
         return stop;
     }


     //// Generator

     function rand(n){
         return Math.floor(Math.random() * n);
     }

     function generate_map(){
         var r = [];
         for (var i = 0;i<bsize;i++){
             r[i] = [];
             for (var j = 0;j<bsize;j++){
                 r[i].push(0);
             }
         }
         
         var x = rand(bsize);
         var y = rand(bsize);

         var map_count = rand(30) + 1;
         r[y][x] = map_count+1;

         var old_dir = undefined;
         var op_dir = {n:"s",e:"w",w:"e",s:"n"};
         var dir_diff = {n:{x:0,y:-1},e:{x:1,y:0},w:{x:-1,y:0},s:{x:0,y:1}};
         var loop = 0;
         for (;;){
             loop+=1;
             if (loop > 1000) break;
             if (map_count == 0) break;
             
             var dir = ("news")[rand(4)];
             if (old_dir === dir) continue;
             var new_x = x + dir_diff[dir].x;
             var new_y = y + dir_diff[dir].y;
             if (new_x < 0 || new_x >= bsize ||
                 new_y < 0 || new_y >= bsize) continue;
             if (r[new_y][new_x] != "0") continue;
             // jump
             var jump = rand(20);
             if (jump < 10) {
                 jump = Math.floor(jump / 4);
             } else if(jump < 15) {
                 jump = Math.floor(jump / 3);
             } else {
                 jump = jump - 10;
             }
             for (var i =0;i<jump;i++){
                 var new_x2 = new_x + dir_diff[dir].x;
                 var new_y2 = new_y + dir_diff[dir].y;
                 if (r[new_y2] == undefined || 
                     r[new_y2][new_x2] != "0") break;
                 new_y = new_y2;
                 new_x = new_x2;
             }
             r[new_y][new_x] = map_count;
             map_count -= 1;
             x = new_x;
             y = new_y;
             loop = 0;
             old_dir = op_dir[dir];
         }
         r[y][x] = "S";
         
         var map = [];
         for (var y = 0;y<bsize;y++){
             for (var x = 0;x<bsize;x++){
                 if (r[y][x] == 0) {
                     r[y][x] = "0";
                 } else if (r[y][x] === "S") {
                     continue;
                 } else {
                     r[y][x] = "1";
                 }
             }
         }

         for (var i = 0;i<bsize;i++){
             map[i] = r[i].join("");
         }
         return map;
     }

}());