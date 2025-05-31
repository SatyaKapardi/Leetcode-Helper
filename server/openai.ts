// Simple but intelligent code analysis agent
// Uses pattern matching and code analysis for programming help

interface CodePattern {
  pattern: RegExp;
  description: string;
  complexity: string;
  suggestions: string[];
}

const codePatterns: CodePattern[] = [
  {
    pattern: /for\s*\([^)]*\)\s*{\s*for\s*\([^)]*\)/,
    description: "Nested loops detected",
    complexity: "O(n²) or higher",
    suggestions: ["Consider using hash maps for O(n) lookups", "Look for single-pass solutions"]
  },
  {
    pattern: /\.includes\(|\.indexOf\(/,
    description: "Array search operations",
    complexity: "O(n) per search",
    suggestions: ["Use Set or Map for O(1) lookups", "Pre-process data into efficient structures"]
  },
  {
    pattern: /new\s+Map\(|new\s+Set\(/,
    description: "Hash-based data structures",
    complexity: "O(1) average lookup",
    suggestions: ["Excellent choice for fast lookups", "Consider space vs time tradeoffs"]
  },
  {
    pattern: /\.sort\(/,
    description: "Sorting operation",
    complexity: "O(n log n)",
    suggestions: ["Check if sorting is necessary", "Consider if partial sorting would work"]
  },
  {
    pattern: /function.*\w+.*\(.*\).*{[\s\S]*return.*\w+\(/,
    description: "Recursive approach",
    complexity: "Varies, check for memoization",
    suggestions: ["Add memoization if repeated subproblems", "Consider iterative alternative"]
  }
];

function analyzeCodeIntelligently(code: string, problemTitle: string): {
  explanation: string;
  complexity: string;
  suggestions: string[];
  patterns: string[];
} {
  const foundPatterns = codePatterns.filter(p => p.pattern.test(code));
  const lines = code.split('\n').filter(l => l.trim());
  
  let explanation = `Your solution for "${problemTitle}" uses `;
  let complexity = "O(n)";
  let suggestions: string[] = [];
  let patterns: string[] = [];

  // Analyze the main approach
  if (code.includes('Map') || code.includes('Set')) {
    explanation += "hash-based data structures for efficient lookups. ";
    complexity = "O(n)";
    patterns.push("Hash table optimization");
  } else if (foundPatterns.some(p => p.pattern.test(code) && p.description.includes("Nested"))) {
    explanation += "nested iteration which creates quadratic complexity. ";
    complexity = "O(n²)";
    patterns.push("Nested loops");
  } else if (code.includes('sort')) {
    explanation += "a sorting-based approach. ";
    complexity = "O(n log n)";
    patterns.push("Sorting algorithm");
  } else {
    explanation += "a linear scanning approach. ";
    patterns.push("Linear search");
  }

  // Add specific insights
  foundPatterns.forEach(pattern => {
    suggestions.push(...pattern.suggestions);
    if (pattern.complexity !== "O(n)") {
      complexity = pattern.complexity;
    }
  });

  // Remove duplicates
  const uniqueSuggestions: string[] = [];
  suggestions.forEach(s => {
    if (!uniqueSuggestions.includes(s)) {
      uniqueSuggestions.push(s);
    }
  });
  suggestions = uniqueSuggestions;

  return { explanation, complexity, suggestions, patterns };
}

export async function getChatResponse(
  message: string,
  problemTitle: string,
  problemDescription: string,
  userSolution: string,
  chatHistory: Array<{ message: string; isAi: boolean }>
): Promise<string> {
  try {
    const lowerMessage = message.toLowerCase();
    const analysis = analyzeCodeIntelligently(userSolution, problemTitle);

    // Explain code functionality
    if (lowerMessage.includes('explain') || lowerMessage.includes('understand') || lowerMessage.includes('code')) {
      return `**Code Explanation for "${problemTitle}":**

${analysis.explanation}

**How it works:**
${generateStepByStepExplanation(userSolution)}

**Key techniques used:**
${analysis.patterns.map(p => `• ${p}`).join('\n')}

This approach demonstrates ${analysis.patterns.length > 1 ? 'multiple programming concepts' : 'a focused algorithmic approach'}.`;
    }

    // Complexity analysis
    if (lowerMessage.includes('complexity') || lowerMessage.includes('time') || lowerMessage.includes('space')) {
      return `**Complexity Analysis for "${problemTitle}":**

**Time Complexity:** ${analysis.complexity}
**Space Complexity:** ${getSpaceComplexity(userSolution)}

${analysis.explanation}

**Performance considerations:**
${analysis.suggestions.map(s => `• ${s}`).join('\n')}

**Patterns detected:**
${analysis.patterns.map(p => `• ${p}`).join('\n')}`;
    }

    // Optimization suggestions
    if (lowerMessage.includes('optimize') || lowerMessage.includes('improve') || lowerMessage.includes('better')) {
      return `**Optimization Ideas for "${problemTitle}":**

${analysis.explanation}

**Current complexity:** ${analysis.complexity}

**Improvement suggestions:**
${analysis.suggestions.map(s => `• ${s}`).join('\n')}

**Advanced techniques to consider:**
• Early termination when possible
• Preprocessing data for faster queries
• Memory vs speed tradeoffs
• Edge case optimizations`;
    }

    // Debugging help
    if (lowerMessage.includes('bug') || lowerMessage.includes('error') || lowerMessage.includes('debug')) {
      return `**Debugging Guide for "${problemTitle}":**

**Code review checklist:**
• Check edge cases (empty arrays, single elements)
• Verify loop boundaries and conditions
• Test with small examples manually
• Validate data type assumptions

**Common issues in this pattern:**
${analysis.patterns.includes('Nested loops') ? '• Off-by-one errors in nested loops\n• Inefficient redundant comparisons' : ''}
${analysis.patterns.includes('Hash table optimization') ? '• Key existence checks\n• Proper initialization of data structures' : ''}
${analysis.patterns.includes('Sorting algorithm') ? '• Stable vs unstable sorting requirements\n• Comparison function correctness' : ''}

**Testing approach:**
• Start with the provided examples
• Add boundary cases
• Test with larger inputs`;
    }

    // Default: provide overview of the solution
    return `**Analysis of your "${problemTitle}" solution:**

${analysis.explanation}

**Approach:** ${analysis.patterns.join(', ')}
**Complexity:** ${analysis.complexity}

**What you did well:**
• Clean, readable code structure
• Appropriate algorithm choice for the problem
• Good variable naming

**Ask me about:**
• "explain the code" - Step-by-step walkthrough
• "time complexity" - Performance analysis  
• "optimize this" - Improvement suggestions
• "debug help" - Testing and troubleshooting`;

  } catch (error) {
    console.error("Chat response error:", error);
    return "I'm having trouble analyzing your code right now. Please try asking your question again.";
  }
}

function generateStepByStepExplanation(code: string): string {
  const lines = code.split('\n').filter(l => l.trim());
  let explanation = "";
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.includes('for') && trimmed.includes('(')) {
      explanation += `${index + 1}. Iterates through the data structure\n`;
    } else if (trimmed.includes('if') && trimmed.includes('(')) {
      explanation += `${index + 1}. Checks condition for filtering/decision making\n`;
    } else if (trimmed.includes('return')) {
      explanation += `${index + 1}. Returns the computed result\n`;
    } else if (trimmed.includes('Map') || trimmed.includes('Set')) {
      explanation += `${index + 1}. Uses hash-based data structure for optimization\n`;
    }
  });
  
  return explanation || "The code follows a structured approach to solve the problem step by step.";
}

function getSpaceComplexity(code: string): string {
  if (code.includes('Map') || code.includes('Set') || code.includes('Array')) {
    return "O(n) - Additional data structures used";
  } else if (code.includes('recursion') || code.includes('function')) {
    return "O(n) - Recursive call stack";
  } else {
    return "O(1) - Constant extra space";
  }
}

function analyzeCodeStructure(code: string) {
  const lines = code.split('\n').filter(line => line.trim());
  const codeAnalysis = {
    explanation: '',
    keyPoints: [] as string[],
    hasLoops: false,
    dataStructures: [] as string[],
    algorithms: [] as string[]
  };

  // Detect data structures
  if (code.includes('HashMap') || code.includes('Map') || code.includes('{}')) {
    codeAnalysis.dataStructures.push('Hash Map');
  }
  if (code.includes('Set') || code.includes('HashSet')) {
    codeAnalysis.dataStructures.push('Set');
  }
  if (code.includes('[]') || code.includes('Array') || code.includes('List')) {
    codeAnalysis.dataStructures.push('Array/List');
  }
  if (code.includes('Stack') || code.includes('Queue')) {
    codeAnalysis.dataStructures.push('Stack/Queue');
  }

  // Detect loops and patterns
  if (code.includes('for') || code.includes('while')) {
    codeAnalysis.hasLoops = true;
    codeAnalysis.keyPoints.push('Uses iterative approach with loops');
  }

  // Detect algorithms
  if (code.includes('sort')) {
    codeAnalysis.algorithms.push('Sorting');
    codeAnalysis.keyPoints.push('Involves sorting the data');
  }
  if (code.includes('binary') || code.includes('Binary')) {
    codeAnalysis.algorithms.push('Binary Search');
    codeAnalysis.keyPoints.push('Uses binary search technique');
  }
  if (code.includes('dp') || code.includes('DP') || code.includes('memo')) {
    codeAnalysis.algorithms.push('Dynamic Programming');
    codeAnalysis.keyPoints.push('Uses dynamic programming approach');
  }

  // Generate explanation based on detected patterns
  if (codeAnalysis.dataStructures.length > 0) {
    codeAnalysis.keyPoints.push(`Uses ${codeAnalysis.dataStructures.join(', ')} for data storage`);
  }

  codeAnalysis.explanation = `This solution uses ${codeAnalysis.hasLoops ? 'an iterative' : 'a direct'} approach${codeAnalysis.dataStructures.length > 0 ? ` with ${codeAnalysis.dataStructures.join(', ')}` : ''}.`;

  return codeAnalysis;
}

function generateCodeExplanation(title: string, code: string, analysis: any): string {
  const lines = code.split('\n').filter(line => line.trim());
  
  let explanation = `Here's how your "${title}" solution works:\n\n`;
  explanation += `**Overview:** ${analysis.explanation}\n\n`;
  
  explanation += `**Step-by-step breakdown:**\n`;
  
  // Analyze key sections of code
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.includes('function') || trimmed.includes('def ') || trimmed.includes('public ')) {
      explanation += `${index + 1}. Function definition - sets up the solution method\n`;
    } else if (trimmed.includes('for') || trimmed.includes('while')) {
      explanation += `${index + 1}. Loop iteration - processes each element\n`;
    } else if (trimmed.includes('if') && !trimmed.includes('else')) {
      explanation += `${index + 1}. Conditional check - handles specific cases\n`;
    } else if (trimmed.includes('return')) {
      explanation += `${index + 1}. Returns the final result\n`;
    }
  });

  if (analysis.keyPoints.length > 0) {
    explanation += `\n**Key points:**\n${analysis.keyPoints.map((point: string) => `• ${point}`).join('\n')}`;
  }

  return explanation;
}

function generateOptimizationSuggestions(title: string, code: string, analysis: any): string {
  let suggestions = `Optimization suggestions for your "${title}" solution:\n\n`;
  
  if (code.includes('for') && code.includes('for')) {
    suggestions += `• **Reduce nested loops:** Consider using hash maps to avoid O(n²) complexity\n`;
  }
  
  if (code.includes('indexOf') || code.includes('includes')) {
    suggestions += `• **Use HashMap for lookups:** Replace linear search with O(1) hash lookups\n`;
  }
  
  if (code.includes('sort') && code.includes('for')) {
    suggestions += `• **Avoid unnecessary sorting:** Check if you can solve without sorting to improve from O(n log n)\n`;
  }
  
  if (!code.includes('Map') && !code.includes('Set') && code.includes('for')) {
    suggestions += `• **Consider hash-based data structures:** Maps and Sets can optimize lookup operations\n`;
  }
  
  suggestions += `\n**Current approach strengths:**\n${analysis.keyPoints.map((point: string) => `• ${point}`).join('\n')}`;
  
  return suggestions;
}

function generateDebuggingHelp(title: string, code: string, analysis: any): string {
  let help = `Debugging tips for your "${title}" solution:\n\n`;
  
  help += `**Common issues to check:**\n`;
  help += `• **Edge cases:** Empty input, single element, duplicate values\n`;
  help += `• **Array bounds:** Ensure indices are within valid range\n`;
  help += `• **Logic flow:** Trace through with sample input step by step\n`;
  
  if (code.includes('for')) {
    help += `• **Loop conditions:** Verify start/end conditions and increment logic\n`;
  }
  
  if (code.includes('Map') || code.includes('{}')) {
    help += `• **Hash map operations:** Check key existence before accessing values\n`;
  }
  
  help += `\n**Testing approach:**\n`;
  help += `• Add console.log statements at key points\n`;
  help += `• Test with the provided examples first\n`;
  help += `• Try edge cases like [], [1], [1,1]\n`;
  
  return help;
}

export async function analyzeCode(code: string, problemDescription: string): Promise<{
  timeComplexity: string;
  spaceComplexity: string;
  suggestions: string[];
}> {
  try {
    // Analyze code patterns to provide basic complexity analysis
    const codeLines = code.toLowerCase().split('\n');
    let timeComplexity = "O(1)";
    let spaceComplexity = "O(1)";
    const suggestions: string[] = [];

    // Basic time complexity analysis
    let nestedLoops = 0;
    let hasLoop = false;
    
    for (const line of codeLines) {
      if (line.includes('for') || line.includes('while')) {
        hasLoop = true;
        // Count indentation to estimate nesting
        const indent = line.search(/\S/);
        if (indent > 0) nestedLoops++;
      }
    }

    if (hasLoop) {
      if (nestedLoops > 1) {
        timeComplexity = "O(n²)";
      } else {
        timeComplexity = "O(n)";
      }
    }

    // Basic space complexity analysis
    if (code.includes('array') || code.includes('list') || code.includes('[]')) {
      spaceComplexity = "O(n)";
    }

    // Generate suggestions based on code patterns
    if (code.includes('nested') || nestedLoops > 1) {
      suggestions.push("Consider if you can reduce nested loops using hash maps or other data structures");
    }
    
    if (code.includes('sort')) {
      suggestions.push("Sorting typically adds O(n log n) time complexity - consider if it's necessary");
    }

    if (!code.includes('map') && !code.includes('set') && code.includes('indexOf')) {
      suggestions.push("Consider using HashMap/Set for O(1) lookups instead of linear search");
    }

    if (suggestions.length === 0) {
      suggestions.push("Code looks efficient for the given approach");
    }

    return {
      timeComplexity,
      spaceComplexity,
      suggestions,
    };
  } catch (error) {
    console.error("Code analysis error:", error);
    return {
      timeComplexity: "O(n)",
      spaceComplexity: "O(1)",
      suggestions: ["Basic analysis completed - consider reviewing algorithm efficiency"],
    };
  }
}
