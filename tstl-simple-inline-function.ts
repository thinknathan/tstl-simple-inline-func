import * as ts from 'typescript';
import * as tstl from 'typescript-to-lua';

// Find every instance of inline start and end
const pattern = /@inlineStart(.*?)@inlineEnd/gs;
// Variable to capture matches
let match: RegExpExecArray | null;
// Running only once doesn't find all values, so we re-run the function this many times
const maxLoop = 200;
// Store list of function names for logging
const changedFunctions: Set<string> = new Set();

function inlineFunction(file: tstl.EmitFile) {
	const functionsToInline: { [key: string]: string } = {};
	while ((match = pattern.exec(file.code)) !== null) {
		const betweenComments = match[1];

		// Check for local function X()
		const localFunctionMatch = betweenComments.match(
			/function\s+(\w+)\s*\([^)]*\)/,
		);
		if (localFunctionMatch) {
			const functionName = localFunctionMatch[1];
			// console.log(`Inlining local function: ${functionName}`);
			const start = betweenComments.indexOf(')') + 1;
			const end = betweenComments.lastIndexOf('end');
			let content = betweenComments.substring(start, end).trim();
			// Check for @removeReturn
			if (betweenComments.includes('@removeReturn')) {
				content = content.replace(/\breturn\b/g, ''); // Remove "return" keywords
			}
			// console.log(`Captured content: ${content}`);
			changedFunctions.add(functionName);
			// Store result for later
			if (functionsToInline[functionName] === undefined)
				functionsToInline[functionName] = content;
		}

		// Check for X = function()
		const functionAssignmentMatch = betweenComments.match(
			/(\w+)\s*=\s*function\s*\([^)]*\)/,
		);
		if (functionAssignmentMatch) {
			const functionName = functionAssignmentMatch[1];
			// console.log(`Inlining function: ${functionName}`);
			const start = betweenComments.indexOf(')') + 1;
			const end = betweenComments.lastIndexOf('end');
			let content = betweenComments.substring(start, end).trim();
			// Check for @removeReturn
			if (betweenComments.includes('@removeReturn')) {
				content = content.replace(/\breturn\b/g, ''); // Remove "return" keywords
			}
			// console.log(`Captured content: ${content}`);
			changedFunctions.add(functionName);
			// Store result for later
			if (functionsToInline[functionName] === undefined)
				functionsToInline[functionName] = content;
		}
	}

	// Iterate through stored functions and replace their occurrences
	Object.entries(functionsToInline).forEach(([functionName, content]) => {
		const functionPattern = new RegExp(
			`\\b(?<!function\\s)${functionName}\\s*\\([^)]*\\)`,
			'g',
		);
		file.code = file.code.replace(functionPattern, content);
	});
}

function removeInlinedFunction(file: tstl.EmitFile) {
	while ((match = pattern.exec(file.code)) !== null) {
		const betweenComments = match[1];
		// Check for local function X()
		const localFunctionMatch = betweenComments.match(
			/function\s+(\w+)\s*\([^)]*\)/,
		);
		// Check for X = function()
		const functionAssignmentMatch = betweenComments.match(
			/(\w+)\s*=\s*function\s*\([^)]*\)/,
		);
		if (functionAssignmentMatch || localFunctionMatch) {
			// Remove function that will be inlined
			file.code = file.code.replace(betweenComments, '');
		}
	}
}

const plugin: tstl.Plugin = {
	afterEmit: (
		_program: ts.Program,
		_options: tstl.CompilerOptions,
		emitHost: tstl.EmitHost,
		result: tstl.EmitFile[],
	) => {
		for (const file of result) {
			for (let index = 0; index < maxLoop; index++) {
				inlineFunction(file);
			}
			for (let index = 0; index < maxLoop; index++) {
				removeInlinedFunction(file);
			}
			// Write the changed code
			emitHost.writeFile(file.outputPath, file.code, false);
		}
		// Display log of function names
		changedFunctions.forEach((changedFunctionName) => {
			// @ts-expect-error Missing definition for `console`
			console.log(`Inlining function ${changedFunctionName}`);
		});
	},
};

export default plugin;
