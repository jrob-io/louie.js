louie.js
========

A Lua interpreter for JavaScript with data access. 
Uses LuaParse by oxyc.

Started making this for a game engine I'm building. Not anywhere near finished or production ready, but wanted to put the source up for anyone working on a similar problem.

Example
=======

	foo = 0

"foo" can be later accessed with:

	var foo = Lua._g.foo;
