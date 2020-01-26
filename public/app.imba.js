function iter$(a){ return a ? (a.toIterable ? a.toIterable() : a) : []; }var raf = (typeof requestAnimationFrame !== 'undefined') ? requestAnimationFrame : (function(blk) { return setTimeout(blk,1000 / 60); });

// Scheduler
class Scheduler {
	constructor(){
		var self = this;
		this.queue = [];
		this.stage = -1;
		this.batch = 0;
		this.scheduled = false;
		this.listeners = {};
		
		this.__ticker = function(e) {
			self.scheduled = false;
			return self.tick(e);
		};
	}
	
	add(item,force){
		if (force || this.queue.indexOf(item) == -1) {
			this.queue.push(item);
		}		
		if (!this.scheduled) { return this.schedule() }	}
	
	listen(ns,item){
		this.listeners[ns] || (this.listeners[ns] = new Set());
		return this.listeners[ns].add(item);
	}
	
	unlisten(ns,item){
		return this.listeners[ns] && this.listeners[ns].delete(item);
	}
	
	get promise(){
		var self = this;
		return new Promise(function(resolve) { return self.add(resolve); });
	}
	
	tick(timestamp){
		var self = this;
		var items = this.queue;
		if (!this.ts) { this.ts = timestamp; }		this.dt = timestamp - this.ts;
		this.ts = timestamp;
		this.queue = [];
		this.stage = 1;
		this.batch++;
		
		if (items.length) {
			for (let i = 0, ary = iter$(items), len = ary.length, item; i < len; i++) {
				item = ary[i];
				if (typeof item === 'string' && this.listeners[item]) {
					this.listeners[item].forEach(function(item) {
						if (item.tick instanceof Function) {
							return item.tick(self);
						} else if (item instanceof Function) {
							return item(self);
						}					});
				} else if (item instanceof Function) {
					item(this.dt,this);
				} else if (item.tick) {
					item.tick(this.dt,this);
				}			}		}		this.stage = 2;
		this.stage = this.scheduled ? 0 : -1;
		return this;
	}
	
	schedule(){
		if (!this.scheduled) {
			this.scheduled = true;
			if (this.stage == -1) {
				this.stage = 0;
			}			raf(this.__ticker);
		}		return this;
	}
}

function iter$$1(a){ return a ? (a.toIterable ? a.toIterable() : a) : []; }function extend$(target,ext){
	var descriptors = Object.getOwnPropertyDescriptors(ext);
	Object.defineProperties(target.prototype,descriptors);
	return target;
}const keyCodes = {
	esc: [27],
	tab: [9],
	enter: [13],
	space: [32],
	up: [38],
	down: [40],
	del: [8,46]
};


// only for web?
extend$(Event,{
	
	wait$mod(state,params){
		return new Promise(function(resolve) {
			return setTimeout(resolve,((params[0] instanceof Number) ? params[0] : 1000));
		});
	},
	
	sel$mod(state,params){
		return state.event.target.closest(params[0]) || false;
	},
	
	throttle$mod({handler,element,event},params){
		if (handler.throttled) { return false }		handler.throttled = true;
		let name = params[0];
		if (!((name instanceof String))) {
			name = ("in-" + (event.type || 'event'));
		}		let cl = element.classList;
		cl.add(name);
		handler.once('idle',function() {
			cl.remove(name);
			return handler.throttled = false;
		});
		return true;
	},
});


// could cache similar event handlers with the same parts
class EventHandler {
	constructor(params,closure){
		this.params = params;
		this.closure = closure;
	}
	
	getHandlerForMethod(el,name){
		if (!(el)) { return null }		return el[name] ? el : this.getHandlerForMethod(el.parentNode,name);
	}
	
	emit(name,...params){
		return imba.emit(this,name,params);
	}
	on(name,...params){
		return imba.listen(this,name,...params);
	}
	once(name,...params){
		return imba.once(this,name,...params);
	}
	un(name,...params){
		return imba.unlisten(this,name,...params);
	}
	
	async handleEvent(event){
		var target = event.target;
		var element = event.currentTarget;
		var mods = this.params;
		let commit = true; // @params.length == 0
		
		// console.log 'handle event',event.type,@params
		this.currentEvents || (this.currentEvents = new Set());
		this.currentEvents.add(event);
		
		let state = {
			element: element,
			event: event,
			modifiers: mods,
			handler: this
		};
		
		for (let val, j = 0, keys = Object.keys(mods), l = keys.length, handler; j < l; j++){
			// let handler = part
			handler = keys[j];val = mods[handler];if (handler.indexOf('~') > 0) {
				handler = handler.split('~')[0];
			}			
			let args = [event,this];
			let res = undefined;
			let context = null;
			
			// parse the arguments
			if (val instanceof Array) {
				args = val.slice();
				
				for (let i = 0, items = iter$$1(args), len = items.length, par; i < len; i++) {
					// what about fully nested arrays and objects?
					// ought to redirect this
					par = items[i];
					if (typeof par == 'string' && par[0] == '~' && par[1] == '$') {
						let name = par.slice(2);
						let chain = name.split('.');
						let value = state[chain.shift()] || event;
						
						for (let i = 0, ary = iter$$1(chain), len = ary.length, part; i < len; i++) {
							part = ary[i];
							value = value ? value[part] : undefined;
						}						
						args[i] = value;
					}				}			}			
			// console.log "handle part",i,handler,event.currentTarget
			// check if it is an array?
			if (handler == 'stop') {
				event.stopImmediatePropagation();
			} else if (handler == 'prevent') {
				event.preventDefault();
			} else if (handler == 'ctrl') {
				if (!event.ctrlKey) { break; }			} else if (handler == 'commit') {
				commit = true;
			} else if (handler == 'silence') {
				commit = false;
			} else if (handler == 'alt') {
				if (!event.altKey) { break; }			} else if (handler == 'shift') {
				if (!event.shiftKey) { break; }			} else if (handler == 'meta') {
				if (!event.metaKey) { break; }			} else if (handler == 'self') {
				if (target != element) { break; }			} else if (handler == 'once') {
				// clean up bound data as well
				element.removeEventListener(event.type,this);
			} else if (handler == 'options') {
				continue;
			} else if (keyCodes[handler]) {
				if (keyCodes[handler].indexOf(event.keyCode) < 0) {
					break;
				}			} else if (handler == 'trigger' || handler == 'emit') {
				let name = args[0];
				let detail = args[1]; // is custom event if not?
				let e = new CustomEvent(name,{bubbles: true,detail: detail}); // : Event.new(name)
				e.originalEvent = event;
				let customRes = element.dispatchEvent(e);
			} else if (typeof handler == 'string') {
				let mod = handler + '$mod';
				
				if (event[mod] instanceof Function) {
					// console.log "found modifier!",mod
					handler = mod;
					context = event;
					args = [state,args];
				} else if (handler[0] == '_') {
					handler = handler.slice(1);
					context = this.closure;
				} else {
					context = this.getHandlerForMethod(element,handler);
				}			}			
			
			if (context) {
				res = context[handler].apply(context,args);
			} else if (handler instanceof Function) {
				res = handler.apply(element,args);
			}			
			if (res && (res.then instanceof Function)) {
				if (commit) { imba.commit(); }				// TODO what if await fails?
				res = await res;
			}			
			if (res === false) {
				break;
			}			
			state.value = res;
		}		
		if (commit) { imba.commit(); }		this.currentEvents.delete(event);
		if (this.currentEvents.size == 0) {
			this.emit('idle');
		}		// what if the result is a promise
		return;
	}
}

var {Document,Node: Node$1,Text: Text$1,Comment: Comment$1,Element: Element$1,SVGElement,HTMLElement: HTMLElement$1,DocumentFragment,Event: Event$1,CustomEvent: CustomEvent$1,MouseEvent,document: document$1} = window;

function iter$$2(a){ return a ? (a.toIterable ? a.toIterable() : a) : []; }function extend$$1(target,ext){
	var descriptors = Object.getOwnPropertyDescriptors(ext);
	Object.defineProperties(target.prototype,descriptors);
	return target;
}
extend$$1(DocumentFragment,{
	
	// Called to make a documentFragment become a live fragment
	setup$(flags,options){
		this.__start = imba.document.createComment('start');
		this.__end = imba.document.createComment('end');
		
		this.__end.replaceWith$ = function(other) {
			this.parentNode.insertBefore(other,this);
			return other;
		};
		
		this.appendChild(this.__start);
		return this.appendChild(this.__end);
	},
	
	// when we for sure know that the only content should be
	// a single text node
	text$(item){
		if (!this.__text) {
			this.__text = this.insert$(item);
		} else {
			this.__text.textContent = item;
		}		return;
	},
	
	insert$(item,options,toReplace){
		if (this.__parent) {
			// if the fragment is attached to a parent
			// we can just proxy the call through
			return this.__parent.insert$(item,options,toReplace || this.__end);
		} else {
			return Element$1.prototype.insert$.call(this,item,options,toReplace || this.__end);
		}	},
	
	insertInto$(parent,before){
		if (!this.__parent) {
			this.__parent = parent;
			parent.appendChild$(this);
		}		return this;
	},
	
	replaceWith$(other,parent){
		this.__start.insertBeforeBegin$(other);
		var el = this.__start;
		while (el){
			let next = el.nextSibling;
			this.appendChild(el);
			if (el == this.__end) { break; }			el = next;
		}		
		return other;
	},
	
	appendChild$(child){
		this.__end.insertBeforeBegin$(child);
		return child;
	},
	
	removeChild$(child){
		child.parentNode && child.parentNode.removeChild(child);
		return this;
	},
	
	isEmpty$(){
		let el = this.__start;
		let end = this.__end;
		
		while (el = el.nextSibling){
			if (el == end) { break; }			if ((el instanceof Element$1) || (el instanceof Text$1)) { return false }		}		return true;
	},
});

class TagCollection {
	constructor(f,parent){
		this.__f = f;
		this.__parent = parent;
		
		if (!(f & 128) && (this instanceof KeyedTagFragment)) {
			this.__start = document$1.createComment('start');
			if (parent) { parent.appendChild$(this.__start); }		}		
		if (!(f & 256)) {
			this.__end = document$1.createComment('end');
			if (parent) { parent.appendChild$(this.__end); }		}		
		this.setup();
	}
	
	get parentContext(){
		return this.__parent;
	}
	
	appendChild$(item,index){
		// we know that these items are dom elements
		if (this.__end && this.__parent) {
			this.__end.insertBeforeBegin$(item);
		} else if (this.__parent) {
			this.__parent.appendChild(item);
		}		return;
	}
	
	replaceWith$(other){
		this.detachNodes();
		this.__end.insertBeforeBegin$(other);
		this.__parent.removeChild(this.__end);
		this.__parent = null;
		return;
	}
	
	joinBefore$(before){
		return this.insertInto$(before.parentNode,before);
	}
	
	insertInto$(parent,before){
		if (!this.__parent) {
			this.__parent = parent;
			before ? before.insertBeforeBegin$(this.__end) : parent.appendChild$(this.__end);
			this.attachNodes();
		}		return this;
	}
	
	setup(){
		return this;
	}
}
class KeyedTagFragment extends TagCollection {
	static init$(){
		return super.inherited instanceof Function && super.inherited(this);
	}
	setup(){
		this.array = [];
		this.changes = new Map();
		this.dirty = false;
		return this.$ = {};
	}
	
	push(item,idx){
		// on first iteration we can merely run through
		if (!(this.__f & 1)) {
			this.array.push(item);
			this.appendChild$(item);
			return;
		}		
		let toReplace = this.array[idx];
		
		if (toReplace === item) ; else {
			this.dirty = true;
			// if this is a new item
			let prevIndex = this.array.indexOf(item);
			let changed = this.changes.get(item);
			
			if (prevIndex === -1) {
				// should we mark the one currently in slot as removed?
				this.array.splice(idx,0,item);
				this.insertChild(item,idx);
			} else if (prevIndex === idx + 1) {
				if (toReplace) {
					this.changes.set(toReplace,-1);
				}				this.array.splice(idx,1);
			} else {
				if (prevIndex >= 0) { this.array.splice(prevIndex,1); }				this.array.splice(idx,0,item);
				this.insertChild(item,idx);
			}			
			if (changed == -1) {
				this.changes.delete(item);
			}		}		return;
	}
	
	insertChild(item,index){
		if (index > 0) {
			let other = this.array[index - 1];
			// will fail with text nodes
			other.insertAfterEnd$(item);
		} else if (this.__start) {
			this.__start.insertAfterEnd$(item);
		} else {
			this.__parent.insertAdjacentElement('afterbegin',item);
		}		return;
	}
	
	removeChild(item,index){
		// @map.delete(item)
		// what if this is a fragment or virtual node?
		if (item.parentNode == this.__parent) {
			this.__parent.removeChild(item);
		}		return;
	}
	
	attachNodes(){
		for (let i = 0, items = iter$$2(this.array), len = items.length, item; i < len; i++) {
			item = items[i];
			this.__end.insertBeforeBegin$(item);
		}		return;
	}
	
	detachNodes(){
		for (let i = 0, items = iter$$2(this.array), len = items.length, item; i < len; i++) {
			item = items[i];
			this.__parent.removeChild(item);
		}		return;
	}
	
	end$(index){
		var self = this;
		if (!(this.__f & 1)) {
			this.__f |= 1;
			return;
		}		
		if (this.dirty) {
			this.changes.forEach(function(pos,item) {
				if (pos == -1) {
					return self.removeChild(item);
				}			});
			this.changes.clear();
			this.dirty = false;
		}		
		// there are some items we should remove now
		if (this.array.length > index) {
			
			// remove the children below
			while (this.array.length > index){
				let item = this.array.pop();
				this.removeChild(item);
			}			// @array.length = index
		}		return;
	}
} KeyedTagFragment.init$();
class IndexedTagFragment extends TagCollection {
	
	static init$(){
		return super.inherited instanceof Function && super.inherited(this);
	}
	setup(){
		this.$ = [];
		return this.length = 0;
	}
	
	end$(len){
		let from = this.length;
		if (from == len || !this.__parent) { return }		let array = this.$;
		let par = this.__parent;
		
		if (from > len) {
			while (from > len){
				par.removeChild$(array[--from]);
			}		} else if (len > from) {
			while (len > from){
				this.appendChild$(array[from++]);
			}		}		this.length = len;
		return;
	}
	
	attachNodes(){
		for (let i = 0, items = iter$$2(this.$), len = items.length, item; i < len; i++) {
			item = items[i];
			if (i == this.length) { break; }			this.__end.insertBeforeBegin$(item);
		}		return;
	}
	
	detachNodes(){
		let i = 0;
		while (i < this.length){
			let item = this.$[i++];
			this.__parent.removeChild$(item);
		}		return;
	}
} IndexedTagFragment.init$();
function createLiveFragment(bitflags,options){
	var el = document$1.createDocumentFragment();
	el.setup$(bitflags,options);
	return el;
}
function createIndexedFragment(bitflags,parent){
	return new IndexedTagFragment(bitflags,parent);
}
function createKeyedFragment(bitflags,parent){
	return new KeyedTagFragment(bitflags,parent);
}

function extend$$2(target,ext){
	var descriptors = Object.getOwnPropertyDescriptors(ext);
	Object.defineProperties(target.prototype,descriptors);
	return target;
}

extend$$2(SVGElement,{
	
	flag$(str){
		this.className.baseVal = str;
		return;
	},
	
	flagSelf$(str){
		// if a tag receives flags from inside <self> we need to
		// redefine the flag-methods to later use both
		var self = this;
		this.flag$ = function(str) { return self.flagSync$(self.__extflags = str); };
		this.flagSelf$ = function(str) { return self.flagSync$(self.__ownflags = str); };
		this.className.baseVal = (this.className.baseVal || '') + ' ' + (this.__ownflags = str);
		return;
	},
	
	flagSync$(){
		return this.className.baseVal = ((this.__extflags || '') + ' ' + (this.__ownflags || ''));
	},
});

function iter$$3(a){ return a ? (a.toIterable ? a.toIterable() : a) : []; }function extend$$3(target,ext){
	var descriptors = Object.getOwnPropertyDescriptors(ext);
	Object.defineProperties(target.prototype,descriptors);
	return target;
}var customElements_;

var root = ((typeof window !== 'undefined') ? window : (((typeof global !== 'undefined') ? global : null)));

var imba$1 = {
	version: '2.0.0',
	global: root,
	ctx: null,
	document: root.document
};

root.imba = imba$1;

(customElements_ = root.customElements) || (root.customElements = {
	define: function() { return console.log('no custom elements'); },
	get: function() { return console.log('no custom elements'); }
});

imba$1.setTimeout = function(fn,ms) {
	return setTimeout(function() {
		fn();
		return imba$1.commit();
	},ms);
};

imba$1.setInterval = function(fn,ms) {
	return setInterval(function() {
		fn();
		return imba$1.commit();
	},ms);
};

imba$1.clearInterval = root.clearInterval;
imba$1.clearTimeout = root.clearTimeout;

imba$1.q$ = function (query,ctx){
	return ((ctx instanceof Element) ? ctx : document).querySelector(query);
};

imba$1.q$$ = function (query,ctx){
	return ((ctx instanceof Element) ? ctx : document).querySelectorAll(query);
};

imba$1.inlineStyles = function (styles){
	var el = document.createElement('style');
	el.textContent = styles;
	document.head.appendChild(el);
	return;
};

var dashRegex = /-./g;

imba$1.toCamelCase = function (str){
	if (str.indexOf('-') >= 0) {
		return str.replace(dashRegex,function(m) { return m.charAt(1).toUpperCase(); });
	} else {
		return str;
	}};

// Basic events - move to separate file?
var emit__ = function(event,args,node) {
	var prev;
	var cb;
	var ret;	
	while ((prev = node) && (node = node.next)){
		if (cb = node.listener) {
			if (node.path && cb[node.path]) {
				ret = args ? cb[node.path].apply(cb,args) : cb[node.path]();
			} else {
				// check if it is a method?
				ret = args ? cb.apply(node,args) : cb.call(node);
			}		}		
		if (node.times && --node.times <= 0) {
			prev.next = node.next;
			node.listener = null;
		}	}	return;
};

// method for registering a listener on object
imba$1.listen = function (obj,event,listener,path){
	var __listeners___;
	var cbs;
	var list;
	var tail;	cbs = (__listeners___ = obj.__listeners__) || (obj.__listeners__ = {});
	list = cbs[event] || (cbs[event] = {});
	tail = list.tail || (list.tail = (list.next = {}));
	tail.listener = listener;
	tail.path = path;
	list.tail = tail.next = {};
	return tail;
};

// register a listener once
imba$1.once = function (obj,event,listener){
	var tail = imba$1.listen(obj,event,listener);
	tail.times = 1;
	return tail;
};

// remove a listener
imba$1.unlisten = function (obj,event,cb,meth){
	var node;
	var prev;	var meta = obj.__listeners__;
	if (!(meta)) { return }	
	if (node = meta[event]) {
		while ((prev = node) && (node = node.next)){
			if (node == cb || node.listener == cb) {
				prev.next = node.next;
				// check for correct path as well?
				node.listener = null;
				break;
			}		}	}	return;
};

// emit event
imba$1.emit = function (obj,event,params){
	var cb;
	if (cb = obj.__listeners__) {
		if (cb[event]) { emit__(event,params,cb[event]); }		if (cb.all) { emit__(event,[event,params],cb.all); }	}	return;
};

imba$1.scheduler = new Scheduler();
imba$1.commit = function() { return imba$1.scheduler.add('render'); };
imba$1.tick = function() {
	imba$1.commit();
	return imba$1.scheduler.promise;
};

/*
DOM
*/


imba$1.mount = function (element,into){
	// automatic scheduling of element - even before
	element.__schedule = true;
	return (into || document.body).appendChild(element);
};


const CustomTagConstructors = {};

class ImbaElementRegistry {
	
	constructor(){
		this.__types = {};
	}
	
	lookup(name){
		return this.__types[name];
	}
	
	get(name,klass){
		if (!(name) || name == 'component') { return ImbaElement }		if (this.__types[name]) { return this.__types[name] }		if (klass && root[klass]) { return root[klass] }		return root.customElements.get(name) || ImbaElement;
	}
	
	create(name){
		if (this.__types[name]) {
			// TODO refactor
			return this.__types[name].create$();
		} else {
			return document.createElement(name);
		}	}
	
	define(name,klass,options){
		this.__types[name] = klass;
		if (options && options.extends) {
			CustomTagConstructors[name] = klass;
		}		
		let proto = klass.prototype;
		if (proto.render && proto.end$ == Element.prototype.end$) {
			proto.end$ = proto.render;
		}		
		root.customElements.define(name,klass);
		return klass;
	}
}
imba$1.tags = new ImbaElementRegistry();

var proxyHandler = {
	get(target,name){
		let ctx = target;
		let val = undefined;
		while (ctx && val == undefined){
			if (ctx = ctx.parentContext) {
				val = ctx[name];
			}		}		return val;
	}
};

extend$$3(Node,{
	
	get __context(){
		var context$_;
		return (context$_ = this.context$) || (this.context$ = new Proxy(this,proxyHandler));
	},
	
	get parentContext(){
		return this.up$ || this.parentNode;
	},
	
	init$(){
		return this;
	},
	
	// replace this with something else
	replaceWith$(other){
		this.parentNode.replaceChild(other,this);
		return other;
	},
	
	insertInto$(parent){
		parent.appendChild$(this);
		return this;
	},
	
	insertBefore$(el,prev){
		return this.insertBefore(el,prev);
	},
	
	insertBeforeBegin$(other){
		return this.parentNode.insertBefore(other,this);
	},
	
	insertAfterEnd$(other){
		if (this.nextSibling) {
			return this.nextSibling.insertBeforeBegin$(other);
		} else {
			return this.parentNode.appendChild(other);
		}	},
});

extend$$3(Comment,{
	// replace this with something else
	replaceWith$(other){
		if (other && other.joinBefore$) {
			other.joinBefore$(this);
		} else {
			this.parentNode.insertBefore$(other,this);
		}		// other.insertBeforeBegin$(this)
		this.parentNode.removeChild(this);
		// @parentNode.replaceChild(other,this)
		return other;
	},
});

// what if this is in a webworker?
extend$$3(Element,{
	
	emit(name,detail,o = {bubbles: true}){
		if (detail != undefined) { o.detail = detail; }		let event = new CustomEvent(name,o);
		let res = this.dispatchEvent(event);
		return event;
	},
	
	slot$(name,ctx){
		return this;
	},
	
	on$(type,mods,scope){
		
		var check = 'on$' + type;
		var handler;		
		// check if a custom handler exists for this type?
		if (this[check] instanceof Function) {
			handler = this[check](mods,scope);
		}		
		handler = new EventHandler(mods,scope);
		var capture = mods.capture;
		var passive = mods.passive;
		
		var o = capture;
		
		if (passive) {
			o = {passive: passive,capture: capture};
		}		
		this.addEventListener(type,handler,o);
		return handler;
	},
	
	// inline in files or remove all together?
	text$(item){
		this.textContent = item;
		return this;
	},
	
	insert$(item,f,prev){
		let type = typeof item;
		
		if (type === 'undefined' || item === null) {
			// what if the prev value was the same?
			if (prev && (prev instanceof Comment)) {
				return prev;
			}			
			let el = document.createComment('');
			prev ? prev.replaceWith$(el) : el.insertInto$(this);
			return el;
		}		
		// dont reinsert again
		if (item === prev) {
			return item;
		} else if (type !== 'object') {
			let res;			let txt = item;
			
			if ((f & 128) && (f & 256)) {
				// FIXME what if the previous one was not text? Possibly dangerous
				// when we set this on a fragment - it essentially replaces the whole
				// fragment?
				this.textContent = txt;
				return;
			}			
			if (prev) {
				if (prev instanceof Text) {
					prev.textContent = txt;
					return prev;
				} else {
					res = document.createTextNode(txt);
					prev.replaceWith$(res,this);
					return res;
				}			} else {
				this.appendChild$(res = document.createTextNode(txt));
				return res;
			}		} else {
			prev ? prev.replaceWith$(item,this) : item.insertInto$(this);
			return item;
		}	},
	
	flag$(str){
		this.className = str;
		return;
	},
	
	flagSelf$(str){
		// if a tag receives flags from inside <self> we need to
		// redefine the flag-methods to later use both
		var self = this;
		this.flag$ = function(str) { return self.flagSync$(self.__extflags = str); };
		this.flagSelf$ = function(str) { return self.flagSync$(self.__ownflags = str); };
		this.className = (this.className || '') + ' ' + (this.__ownflags = str);
		return;
	},
	
	flagSync$(){
		return this.className = ((this.__extflags || '') + ' ' + (this.__ownflags || ''));
	},
	
	open$(){
		return this;
	},
	
	close$(){
		return this;
	},
	
	end$(){
		if (this.render) { this.render(); }		return;
	},
	
	css$(key,value,mods){
		return this.style[key] = value;
	},
});

Element.prototype.appendChild$ = Element.prototype.appendChild;
Element.prototype.removeChild$ = Element.prototype.removeChild;
Element.prototype.insertBefore$ = Element.prototype.insertBefore;
Element.prototype.replaceChild$ = Element.prototype.replaceChild;
Element.prototype.set$ = Element.prototype.setAttribute;

imba$1.createLiveFragment = createLiveFragment;
imba$1.createIndexedFragment = createIndexedFragment;
imba$1.createKeyedFragment = createKeyedFragment;

// Create custom tag with support for scheduling and unscheduling etc

var mountedQueue;var mountedFlush = function() {
	let items = mountedQueue;
	mountedQueue = null;
	if (items) {
		for (let i = 0, ary = iter$$3(items), len = ary.length, item; i < len; i++) {
			item = ary[i];
			item.mounted$();
		}	}	return;
};


class ImbaElement extends HTMLElement {
	static init$(){
		return super.inherited instanceof Function && super.inherited(this);
	}
	constructor(){
		super();
		this.setup$();
		if (this.build) { this.build(); }	}
	
	setup$(){
		this.__slots = {};
		return this.__f = 0;
	}
	
	init$(){
		this.__f |= 1;
		return this;
	}
	
	// returns the named slot - for context
	slot$(name,ctx){
		var slots_;
		if (name == '__' && !this.render) {
			return this;
		}		
		return (slots_ = this.__slots)[name] || (slots_[name] = imba$1.createLiveFragment());
	}
	
	schedule(){
		imba$1.scheduler.listen('render',this);
		this.__f |= 64;
		return this;
	}
	
	unschedule(){
		imba$1.scheduler.unlisten('render',this);
		this.__f &= ~64;
		return this;
	}
	
	
	connectedCallback(){
		let flags = this.__f;
		
		if (flags & 16) {
			return;
		}		
		if (this.mounted instanceof Function) {
			if (!(mountedQueue)) {
				mountedQueue = [];
				Promise.resolve().then(mountedFlush);
			}			mountedQueue.unshift(this);
		}		
		if (!(flags & 1)) {
			this.init$();
		}		
		if (!(flags & 8)) {
			this.__f |= 8;
			if (this.awaken) { this.awaken(); }		}		
		if (!(flags)) {
			if (this.render) { this.render(); }		}		
		this.mount$();
		return this;
	}
	
	mount$(){
		this.__f |= 16;
		
		if (this.__schedule) { this.schedule(); }		
		if (this.mount instanceof Function) {
			let res = this.mount();
			if (res && (res.then instanceof Function)) {
				res.then(imba$1.commit);
			}		}		return this;
	}
	
	mounted$(){
		if (this.mounted instanceof Function) { this.mounted(); }		return this;
	}
	
	disconnectedCallback(){
		this.__f &= ~16;
		if (this.__f & 64) { this.unschedule(); }		if (this.unmount instanceof Function) { return this.unmount() }	}
	
	tick(){
		return this.render && this.render();
	}
	
	awaken(){
		return this.__schedule = true;
	}
} ImbaElement.init$();

root.customElements.define('imba-element',ImbaElement);


imba$1.createElement = function (name,bitflags,parent,flags,text,sfc){
	var el = document.createElement(name);
	
	if (flags) { el.className = flags; }	
	if (sfc) {
		el.setAttribute('data-' + sfc,'');
	}	
	if (text !== null) {
		el.text$(text);
	}	
	if (parent && (parent instanceof Node)) {
		el.insertInto$(parent);
	}	
	return el;
};

imba$1.createComponent = function (name,bitflags,parent,flags,text,sfc){
	// the component could have a different web-components name?
	var el = document.createElement(name);
	
	if (CustomTagConstructors[name]) {
		el = CustomTagConstructors[name].create$(el);
		el.slot$ = ImbaElement.prototype.slot$;
		el.__slots = {};
	}	
	el.up$ = parent;
	el.__f = bitflags;
	el.init$();
	
	if (text !== null) {
		el.slot$('__').text$(text);
	}	
	if (flags) { el.className = flags; }	
	if (sfc) {
		el.setAttribute('data-' + sfc,'');
	}	
	return el;
};

imba$1.createSVGElement = function (name,bitflags,parent,flags,text,sfc){
	var el = document.createElementNS("http://www.w3.org/2000/svg",name);
	if (flags) {
		{
			el.className.baseVal = flags;
		}	}	if (parent && (parent instanceof Node)) {
		el.insertInto$(parent);
	}	return el;
};

// import './intersect'

imba.inlineStyles(":root{--third:rgba(105,36,166,1.00);--first:rgba(255,89,69,1.00);--second:rgba(255,220,0,1.00);--white:#fff;--gray:#f0f0f0;--mediumgray:#606060;--dark:#444444;--shadow:rgba(10,10,0,.1);}*{margin:0;padding:0;box-sizing:border-box;}.clearfix::after{content:\"\";display:table;clear:both;}body{background-color:var(--third);}pig-game{width:100%;background:var(--first);background-size:cover;background-position:center;font-family:Lato;font-weight:300;min-height:100vh;color:var(--dark);}.wrapper{width:1000px;position:absolute;top:35%;left:50%;-webkit-transform:translate(-50%,-50%);-ms-transform:translate(-50%,-50%);transform:translate(-50%,-50%);background-color:var(--white);box-shadow:0px 10px 50px var(--shadow);}player-panel{width:50%;float:left;height:600px;padding:100px;background-color:var(--white);}.player-name{font-size:40px;text-align:center;text-transform:uppercase;-webkit-letter-spacing:2px;-moz-letter-spacing:2px;-ms-letter-spacing:2px;letter-spacing:2px;font-weight:100;margin-top:20px;margin-bottom:10px;position:relative;}.player-score{text-align:center;font-size:80px;font-weight:100;color:var(--first);margin-bottom:130px;}.active{background-color:var(--gray);}.active .player-name{font-weight:300;}.active .player-name::after{content:\"X\";font-size:47px;position:absolute;color:var(--first);top:-7px;right:10px;}.player-current-box{background-color:var(--first);color:var(--white);width:40%;margin:0 auto;padding:12px;text-align:center;}.player-current-label{text-transform:uppercase;margin-bottom:10px;font-size:12px;color:var(--gray);}.player-current-score{font-size:30px;}.hidden{display:none;}.button-wrapper{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;height:200px;position:absolute;left:50%;-webkit-transform:translateX(-50%);-ms-transform:translateX(-50%);transform:translateX(-50%);width:200px;-webkit-flex-direction:column;-ms-flex-direction:column;flex-direction:column;bottom:0;}button{width:200px;color:var(--dark);background:none;border:none;font-family:Lato;font-size:20px;text-transform:uppercase;cursor:pointer;font-weight:300;-webkit-transition:background-color 0.3s,color 0.3s;transition:background-color 0.3s,color 0.3s;}button:hover{font-weight:600;}button:hover i{margin-right:20px;}button:focus{outline:none;}i{color:var(--first);display:inline-block;margin-right:15px;font-size:32px;line-height:1;vertical-align:text-top;margin-top:-4px;-webkit-transition:margin 0.3s;transition:margin 0.3s;}.btn-new{top:45px;}.btn-roll{top:403px;}.btn-hold{top:467px;}.dice{position:absolute;left:50%;top:160px;-webkit-transform:translateX(-50%);-ms-transform:translateX(-50%);transform:translateX(-50%);height:130px;box-shadow:0px 10px 60px var(--shadow);display:block;}.winner{background-color:var(--gray);}.winner .player-name{font-weight:300;color:var(--first);}game-info{position:absolute;top:600px;width:100%;color:var(--gray);text-align:center;display:block;}game-info a{color:var(--second);}.rules{background-color:var(--mediumgray);color:var(--white);text-align:left;padding:1em 2em;margin-bottom:1em;}\n");
var $1 = new WeakMap();
let activePlayer = 0;
let targetScore = 200;
let totalScore = [0,0];
let turnScore = 0;
let dice = 0;
let playing = true;
class GameInfoComponent extends imba.tags.get('component','ImbaElement') {
	render(){
		var t$0, c$0, b$0, d$0, t$1, t$2, t$3, v$3, t$4, v$4, v$1;
		t$0=this;
		t$0.open$();
		c$0 = (b$0=d$0=1,t$0.$) || (b$0=d$0=0,t$0.$={});
		b$0 || (t$1=imba.createElement('p',0,t$0,'rules',null,null));
		b$0 || (t$2=imba.createElement('b',0,t$1,null,"How to Play:",null));
		b$0 || (t$2=imba.createElement('ol',0,t$1,null,null,null));
		t$3 = c$0.b || (c$0.b = t$3=imba.createElement('li',0,t$2,null,null,null));
		(v$3="First player to reach ",v$3===c$0.c || (c$0.c_ = t$3.insert$(c$0.c=v$3,0,c$0.c_)));
		t$4 = c$0.d || (c$0.d = t$4=imba.createElement('b',4096,t$3,null,null,null));
		(v$4=targetScore,v$4===c$0.e || (c$0.e_ = t$4.insert$(c$0.e=v$4,0,c$0.e_)));
		(v$3=" wins",v$3===c$0.f || (c$0.f_ = t$3.insert$(c$0.f=v$3,0,c$0.f_)));
		t$3 = c$0.g || (c$0.g = t$3=imba.createElement('li',0,t$2,null,null,null));
		(v$3="If Dice Rolls 1, ",v$3===c$0.h || (c$0.h_ = t$3.insert$(c$0.h=v$3,0,c$0.h_)));
		b$0 || (t$4=imba.createElement('b',0,t$3,null,"you lose your lot",null));
		(v$3=", and your turn ends",v$3===c$0.i || (c$0.i_ = t$3.insert$(c$0.i=v$3,0,c$0.i_)));
		t$3 = c$0.j || (c$0.j = t$3=imba.createElement('li',0,t$2,null,null,null));
		(v$3="Press ",v$3===c$0.k || (c$0.k_ = t$3.insert$(c$0.k=v$3,0,c$0.k_)));
		b$0 || (t$4=imba.createElement('b',0,t$3,null,'\"HOLD\" ',null));
		(v$3="to add your lot to your score and end your turn.",v$3===c$0.l || (c$0.l_ = t$3.insert$(c$0.l=v$3,0,c$0.l_)));
		t$1 = c$0.m || (c$0.m = t$1=imba.createElement('p',0,t$0,'credits',null,null));
		(v$1="Coded by ",v$1===c$0.n || (c$0.n_ = t$1.insert$(c$0.n=v$1,0,c$0.n_)));
		b$0 || (t$2=imba.createElement('a',0,t$1,null,"Eric",null));
		b$0 || (t$2.href="https://github.com/iamtirado/pig-game");
		(v$1=" with the ",v$1===c$0.o || (c$0.o_ = t$1.insert$(c$0.o=v$1,0,c$0.o_)));
		b$0 || (t$2=imba.createElement('a',0,t$1,null,"Imba",null));
		b$0 || (t$2.href="http://imba.io");
		(v$1=" Language. Example borrowoed from the ",v$1===c$0.p || (c$0.p_ = t$1.insert$(c$0.p=v$1,0,c$0.p_)));
		b$0 || (t$2=imba.createElement('a',0,t$1,null,"Jonas.io",null));
		b$0 || (t$2.href="https://jonas.io");
		(v$1=" Javascript course",v$1===c$0.q || (c$0.q_ = t$1.insert$(c$0.q=v$1,0,c$0.q_)));
		t$0.close$(d$0);
		return t$0;
	}
} imba.tags.define('game-info',GameInfoComponent,{});

class PlayerPanelComponent extends imba.tags.get('component','ImbaElement') {
	static init$(){
		
		return this;
	}
	init$(){
		super.init$();return undefined;
	}
	set player(value) {
		return $1.set(this,value);
	}
	get player() {
		return $1.get(this);
	}
	// if player panel is same as active player show turn's score, or else show 0
	currentScore(){
		if (this.player === activePlayer) { return turnScore } else {
			return 0;
		}	}
	// if thers is a winner, show winner or else show player name.
	playerName(){
		if (playing === false && this.player === activePlayer) {
			return "Winner!";
		} else {
			return ("Player " + (this.player + 1));
		}	}
	// if player has won, evaluate to true
	playerWins(){ // i2 - put inline
		if (this.player === activePlayer && playing === false) {
			return true;
		}	}
	isActive(){ // i2 - put inline
		return this.player === activePlayer && playing;
	}
	
	isWinner(){ // i2 - put inline
		return playing === false && this.player === activePlayer;
	}
	render(){
		var t$0, c$0, b$0, d$0, v$0, t$1, v$1, t$2, v$2;
		t$0=this;
		t$0.open$();
		c$0 = (b$0=d$0=1,t$0.$) || (b$0=d$0=0,t$0.$={});
		(v$0=(this.player === activePlayer && playing||undefined),v$0===c$0.s||(d$0|=2,c$0.s=v$0));
		(v$0=(playing === false && this.player === activePlayer||undefined),v$0===c$0.u||(d$0|=2,c$0.u=v$0));
		((!b$0||d$0&2) && t$0.flagSelf$((c$0.s ? `active` : '')+' '+(c$0.u ? `winner` : '')));
		t$1 = c$0.v || (c$0.v = t$1=imba.createElement('div',4096,t$0,'player-name',null,null));
		(imba.ctx=(c$0.w$ || (c$0.w$={_:t$1})),v$1=this.playerName(),v$1===c$0.w || (c$0.w_ = t$1.insert$(c$0.w=v$1,0,c$0.w_)));
		t$1 = c$0.x || (c$0.x = t$1=imba.createElement('div',4096,t$0,'player-score',null,null));
		(v$1=totalScore[this.player],v$1===c$0.y || (c$0.y_ = t$1.insert$(c$0.y=v$1,0,c$0.y_)));
		b$0 || (t$1=imba.createElement('div',0,t$0,'player-current-box',null,null));
		b$0 || (t$2=imba.createElement('div',0,t$1,'player-current-label',"lot",null));
		t$2 = c$0.z || (c$0.z = t$2=imba.createElement('div',4096,t$1,'player-current-score',null,null));
		(imba.ctx=(c$0.aa$ || (c$0.aa$={_:t$2})),v$2=this.currentScore(),v$2===c$0.aa || (c$0.aa_ = t$2.insert$(c$0.aa=v$2,0,c$0.aa_)));
		t$0.close$(d$0);
		return t$0;
	}
} PlayerPanelComponent.init$(); imba.tags.define('player-panel',PlayerPanelComponent,{});

class PigGameComponent extends imba.tags.get('component','ImbaElement') {
	// reset all values and switch players
	nextPlayer(){
		if (playing) {
			if (activePlayer === 0) { activePlayer = 1; } else {
				activePlayer = 0;
			}			return turnScore = 0;
		}	}
	newGame(){
		totalScore = [0,0];
		turnScore = 0;
		playing = true;
		return this.nextPlayer();
	}
	hasWon(player){
		if (totalScore[player] >= targetScore) {
			return playing = false;
		}	}
	holdScore(){
		totalScore[activePlayer] += turnScore;
		turnScore = 0;
		// if playeer has won
		if (totalScore[activePlayer] >= targetScore) {
			playing = false;
		}		return this.nextPlayer();
	}
	loseScore(){
		turnScore = 0;
		hasWon(activePlayer);
		return this.nextPlayer();
	}
	rollDice(){
		if (playing) {
			// TODO: Change 3 to 6 for production
			dice = Math.floor(Math.random() * 6) + 1;
			if (dice !== 1) {
				return turnScore += dice;
			} else {
				return this.loseScore();
			}		}	}
	
	render(){
		var t$0, c$0, b$0, d$0, t$1, t$2, b$2, d$2, t$3, b$3, d$3, t$4, v$3, ak$$2, al$$2;
		t$0=this;
		t$0.open$();
		c$0 = (b$0=d$0=1,t$0.$) || (b$0=d$0=0,t$0.$={});
		t$1 = c$0.ab || (c$0.ab = t$1=imba.createElement('div',1024,t$0,'wrapper clearfix',null,null));
		t$2 = (b$2=d$2=1,c$0.ac) || (b$2=d$2=0,c$0.ac=t$2=imba.createComponent('player-panel',0,t$1,null,null,null));
		b$2 || (t$2.player=0);
		b$2 || !t$2.setup || t$2.setup(d$2);
		t$2.end$(d$2);
		b$2 || t$2.insertInto$(t$1);
		t$2 = (b$2=d$2=1,c$0.ad) || (b$2=d$2=0,c$0.ad=t$2=imba.createComponent('player-panel',0,t$1,null,null,null));
		b$2 || (t$2.player=1);
		b$2 || !t$2.setup || t$2.setup(d$2);
		t$2.end$(d$2);
		b$2 || t$2.insertInto$(t$1);
		b$0 || (t$2=imba.createElement('div',0,t$1,'button-wrapper',null,null));
		t$3 = (b$3=d$3=1,c$0.ae) || (b$3=d$3=0,c$0.ae=t$3=imba.createElement('button',0,t$2,'btn-new',null,null));
		b$3 || (t$3.on$(`click`,{newGame: true},this));
		b$3 || (t$4=imba.createElement('i',0,t$3,'fi-plus',null,null));
		(v$3="New game",v$3===c$0.af || (c$0.af_ = t$3.insert$(c$0.af=v$3,0,c$0.af_)));
		t$3 = (b$3=d$3=1,c$0.ag) || (b$3=d$3=0,c$0.ag=t$3=imba.createElement('button',0,t$2,'btn-roll',null,null));
		b$3 || (t$3.on$(`click`,{rollDice: true},this));
		b$3 || (t$4=imba.createElement('i',0,t$3,'fi-loop',null,null));
		(v$3="Roll Dice",v$3===c$0.ah || (c$0.ah_ = t$3.insert$(c$0.ah=v$3,0,c$0.ah_)));
		t$3 = (b$3=d$3=1,c$0.ai) || (b$3=d$3=0,c$0.ai=t$3=imba.createElement('button',0,t$2,'btn-roll',null,null));
		b$3 || (t$3.on$(`click`,{holdScore: true},this));
		b$3 || (t$4=imba.createElement('i',0,t$3,'fi-arrow-down',null,null));
		(v$3="Hold",v$3===c$0.aj || (c$0.aj_ = t$3.insert$(c$0.aj=v$3,0,c$0.aj_)));
		if (dice !== 0) {
			ak$$2 = (b$3=d$3=1,c$0.ak) || (b$3=d$3=0,c$0.ak=ak$$2=imba.createElement('img',0,null,'dice',null,null));
			b$3||(ak$$2.up$=t$1);
			(v$3=("./images/dice-" + dice + ".png"),v$3===c$0.am || (ak$$2.src=c$0.am=v$3));
			(v$3=("dice-" + dice),v$3===c$0.an || (ak$$2.alt=c$0.an=v$3));
		} else {
			al$$2 = (b$3=d$3=1,c$0.al) || (b$3=d$3=0,c$0.al=al$$2=imba.createElement('img',0,null,'dice',null,null));
			b$3||(al$$2.up$=t$1);
			b$3 || (al$$2.src="./images/dice-1.png");
			b$3 || (al$$2.alt="dice-1");
		}
		(c$0.ak$$2_ = t$1.insert$(ak$$2,1024,c$0.ak$$2_));
		(c$0.al$$2_ = t$1.insert$(al$$2,1024,c$0.al$$2_));		t$2 = (b$2=d$2=1,c$0.ao) || (b$2=d$2=0,c$0.ao=t$2=imba.createComponent('game-info',0,t$1,null,null,null));
		b$2 || !t$2.setup || t$2.setup(d$2);
		t$2.end$(d$2);
		b$2 || t$2.insertInto$(t$1);
		t$0.close$(d$0);
		return t$0;
	}
} imba.tags.define('pig-game',PigGameComponent,{});



/* css
:root {
	--third: rgba(105, 36, 166, 1.00);
	--first: rgba(255, 89, 69, 1.00);
	--second: rgba(255, 220, 0, 1.00);
	--white: #fff;
	--gray: #f0f0f0;
	--mediumgray: #606060;
	--dark: #444444;
	--shadow: rgba(10,10,0,.1);
}

* {
	margin: 0;
	padding: 0;
	box-sizing: border-box;
}

.clearfix::after {
	content: "";
	display: table;
	clear: both;
}
body {
	background-color: var(--third);
}
pig-game {
	width: 100%;
	background: var(--first);
	background-size: cover;
	background-position: center;
	font-family: Lato;
	font-weight: 300;
	min-height: 100vh;
	color: var(--dark);
}

.wrapper {
	width: 1000px;
	position: absolute;
	top: 35%;
	left: 50%;
	transform: translate(-50%, -50%);
	background-color: var(--white);
	box-shadow: 0px 10px 50px var(--shadow);
}

player-panel {
	width: 50%;
	float: left;
	height: 600px;
	padding: 100px;
	background-color: var(--white);
}

.player-name {
	font-size: 40px;
	text-align: center;
	text-transform: uppercase;
	letter-spacing: 2px;
	font-weight: 100;
	margin-top: 20px;
	margin-bottom: 10px;
	position: relative;
}

.player-score {
	text-align: center;
	font-size: 80px;
	font-weight: 100;
	color: var(--first);
	margin-bottom: 130px;
}

.active {
	background-color: var(--gray);
}

.active .player-name {
	font-weight: 300;
}

.active .player-name::after {
	content: "X";
	font-size: 47px;
	position: absolute;
	color: var(--first);
	top: -7px;
	right: 10px;
}

.player-current-box {
	background-color: var(--first);
	color: var(--white);
	width: 40%;
	margin: 0 auto;
	padding: 12px;
	text-align: center;
}

.player-current-label {
	text-transform: uppercase;
	margin-bottom: 10px;
	font-size: 12px;
	color: var(--gray);
}

.player-current-score {
	font-size: 30px;
}

.hidden {
	display: none;
}
.button-wrapper {
	display: flex;
	height: 200px;
	position: absolute;
	left: 50%;
	transform: translateX(-50%);
	width: 200px;
	flex-direction: column;
	bottom: 0;
}
button {
	width: 200px;
	color: var(--dark);
	background: none;
	border: none;
	font-family: Lato;
	font-size: 20px;
	text-transform: uppercase;
	cursor: pointer;
	font-weight: 300;
	transition: background-color 0.3s, color 0.3s;
}

button:hover {
	font-weight: 600;
}

button:hover i {
	margin-right: 20px;
}

button:focus {
	outline: none;
}

i {
	color: var(--first);
	display: inline-block;
	margin-right: 15px;
	font-size: 32px;
	line-height: 1;
	vertical-align: text-top;
	margin-top: -4px;
	transition: margin 0.3s;
}

.btn-new {
	top: 45px;
}

.btn-roll {
	top: 403px;
}

.btn-hold {
	top: 467px;
}

.dice {
	position: absolute;
	left: 50%;
	top: 160px;
	transform: translateX(-50%);
	height: 130px;
	box-shadow: 0px 10px 60px var(--shadow);
	display: block;
}

.winner {
	background-color: var(--gray);
}

.winner .player-name {
	font-weight: 300;
	color: var(--first);
}

game-info {
	position: absolute;
	top: 600px;
	width: 100%;
	color: var(--gray);
	text-align: center;
	display: block;
}
game-info a {
	color: var(--second);
}

.rules {
	background-color: var(--mediumgray);
	color: var(--white);
	text-align: left;
	padding: 1em 2em;
	margin-bottom: 1em;
}
*/
//# sourceMappingURL=app.imba.js.map
