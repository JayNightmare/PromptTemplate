/**
 * @fileoverview Main application logic for the Prompt Template Hub SPA.
 * Handles state management, DOM updates, and user interactions.
 */

const defaultTemplates = {
	code: {
		title: "Code Agent",
		fields: [
			{
				id: "techStack",
				label: "Tech Stack",
				type: "text",
				suggestions: [
					"React + Node",
					"Python UI",
					"Vanilla JS",
					"Next.js + Tailwind",
				],
			},
			{
				id: "aim",
				label: "Aim",
				type: "text",
				suggestions: [
					"Build New Feature",
					"Refactor Existing Code",
					"Debug Issue",
					"Setup Infrastructure",
				],
			},
			{
				id: "goal",
				label: "Goal",
				type: "textarea",
				placeholder:
					"e.g., Implement user authentication with JWT...",
			},
			{
				id: "settings",
				label: "Other Settings",
				type: "text",
				suggestions: [
					"TDD approach",
					"Strict TypeScript",
					"Performance focused",
					"Focus on Accessibility",
				],
			},
		],
		generate: (
			values,
		) => `You are an expert Software Engineer and AI Pair Programmer.
Your goal is to provide a detailed, step-by-step implementation plan for the following task.

**Requirements & Constraints:**
- Adhere strictly to SOLID and DRY principles.
- Prioritize maintainability, readability, and security.
- Outline the architecture, proposed file structure, and specific functions/classes to be created.
- Identify edge cases and error handling strategies.
- Do NOT output the full code yet. Focus entirely on the architectural plan and technical approach.

**Context:**
- Tech Stack: ${values.techStack || "Not specified"}
- Aim: ${values.aim || "Not specified"}
- Additional Settings: ${values.settings || "None"}

**Task Description (Goal):**
${values.goal || "[Please provide a goal]"}

Please respond with your plan formatted in Markdown.`,
	},
	research: {
		title: "Research Agent",
		fields: [
			{
				id: "topic",
				label: "Topic",
				type: "text",
				suggestions: [
					"Latest AI trends",
					"React Performance",
					"Database Scaling",
				],
			},
			{
				id: "focus",
				label: "Focus Areas",
				type: "text",
				suggestions: [
					"Academic Papers",
					"Official Documentation",
					"Practical Tutorials",
					"Compare tools",
				],
			},
			{
				id: "goal",
				label: "Specific Question",
				type: "textarea",
				placeholder:
					"e.g., What are the best practices for handling timezone data in PostgreSQL?",
			},
		],
		generate: (values) => `You are an expert Research Analyst Agent.
Your goal is to comprehensively research the given topic using web search tools and/or local documentation folders.

**Instructions:**
- Gather all available context before forming conclusions.
- Synthesize the information into a clear, structured summary.
- Highlight key takeaways, common patterns, and potential pitfalls related to the topic.
- Provide direct citations or references to the sources used.
- Identify any gaps in the available information and suggest follow-up questions if necessary.

**Focus Area:** ${values.focus || "General Overview"}

**Topic to Research:**
${values.topic || "[Please provide a topic]"}

**Specific Question / Context:**
${values.goal || "[None]"}

Please present your findings in a comprehensive Markdown report.`,
	},
	design: {
		title: "Design Agent",
		fields: [
			{
				id: "style",
				label: "Design Style",
				type: "text",
				suggestions: [
					"Minimalism",
					"Glassmorphism",
					"Material Design",
					"Neumorphism",
				],
			},
			{
				id: "color",
				label: "Color Palette Preference",
				type: "text",
				suggestions: [
					"Dark Mode",
					"Vibrant Pastels",
					"Monochrome",
					"High Contrast",
				],
			},
			{
				id: "goal",
				label: "Project Description",
				type: "textarea",
				placeholder:
					"e.g., A personal portfolio website for a freelance photographer...",
			},
		],
		generate: (values) => `You are an expert UX/UI Designer Agent.
Your goal is to propose modern, aesthetically pleasing design patterns and color palettes for the specified project.

**Focus Areas:**
1. **Design System:** Suggest a cohesive color palette (in Hex or HSL), typography choices, and layout structure.
2. **Aesthetics:** Incorporate modern trends that elevate the user experience.
3. **Accessibility:** Ensure sufficient contrast ratios and clear visual hierarchies.
4. **Interactivity:** Suggest micro-animations or hover states to make the UI feel alive.

**Preferences:**
- Style: ${values.style || "Best fit for project"}
- Color Palette: ${values.color || "Designer discretion"}

**Project Description:**
${values.goal || "[Please provide a project description]"}

Please output your design proposals, including specific CSS variables or Tailwind classes if applicable, formatted in clear Markdown.`,
	},
};

let customTemplates = {};
let currentTemplateId = "code";
let isCustomTab = false;

/**
 * Initializes the application, setting up event listeners and default state.
 */
function init() {
	loadCustomTemplates();

	const navButtons = document.querySelectorAll(".nav-btn");
	const copyBtn = document.getElementById("copy-btn");

	// Set up navigation listeners
	navButtons.forEach((btn) => {
		btn.addEventListener("click", (e) =>
			handleNavClick(e, navButtons),
		);
	});

	// Set up copy listener
	if (copyBtn) {
		copyBtn.addEventListener("click", handleCopy);
	}

	setupThemeSwitcher();
	setupHistoryDrawer();
	setupChainDropdown();

	// Load initial template
	updateTemplateView("code");
}

const themes = ["dark", "light", "cyberpunk"];
let currentThemeIndex = 0;

function setupThemeSwitcher() {
	const themeBtn = document.getElementById("theme-btn");
	if (!themeBtn) return;

	// Load saved theme
	const savedTheme = localStorage.getItem("pth_theme") || "dark";
	currentThemeIndex =
		themes.indexOf(savedTheme) !== -1
			? themes.indexOf(savedTheme)
			: 0;
	applyTheme(themes[currentThemeIndex]);

	themeBtn.addEventListener("click", () => {
		currentThemeIndex = (currentThemeIndex + 1) % themes.length;
		const newTheme = themes[currentThemeIndex];
		applyTheme(newTheme);
	});
}

function applyTheme(theme) {
	if (theme === "dark") {
		document.documentElement.removeAttribute("data-theme");
	} else {
		document.documentElement.setAttribute("data-theme", theme);
	}
	localStorage.setItem("pth_theme", theme);
}

function setupHistoryDrawer() {
	const toggleBtn = document.getElementById("history-toggle-btn");
	const closeBtn = document.getElementById("close-history-btn");
	const drawer = document.getElementById("history-drawer");

	if (!toggleBtn || !drawer) return;

	toggleBtn.addEventListener("click", () => {
		drawer.classList.add("open");
		renderHistoryDrawer();
	});

	if (closeBtn) {
		closeBtn.addEventListener("click", () => {
			drawer.classList.remove("open");
		});
	}
}

function setupChainDropdown() {
	const chainBtn = document.getElementById("chain-btn");
	const dropdown = document.getElementById("chain-dropdown");

	if (!chainBtn || !dropdown) return;

	// Toggle dropdown
	chainBtn.addEventListener("click", (e) => {
		e.stopPropagation();
		dropdown.classList.toggle("hidden");
		populateChainDropdown();
	});

	// Close dropdown when clicking outside
	document.addEventListener("click", () => {
		dropdown.classList.add("hidden");
	});
}

function populateChainDropdown() {
	const dropdown = document.getElementById("chain-dropdown");
	if (!dropdown) return;

	dropdown.innerHTML = "";

	const templateKeys = Object.keys(customTemplates);
	if (templateKeys.length === 0) {
		dropdown.innerHTML =
			'<div style="padding: 0.5rem; color: var(--text-secondary); font-size: 0.85rem;">No custom templates available.</div>';
		return;
	}

	templateKeys.forEach((key) => {
		const item = document.createElement("button");
		item.className = "dropdown-item";
		item.textContent = customTemplates[key].title;
		item.addEventListener("click", () => {
			const currentOutput =
				document.getElementById(
					"template-code",
				).textContent;
			sendToCustomTemplate(key, currentOutput);
		});
		dropdown.appendChild(item);
	});
}

function sendToCustomTemplate(templateId, content) {
	// Switch to Custom Tab
	const customBtn = document.getElementById("btn-custom");
	if (customBtn) customBtn.click();

	// Need to wait slightly for the view to render before selecting the template
	setTimeout(() => {
		const templateItems = document.querySelectorAll(
			".custom-template-item",
		);
		// Find the correct item and simulate click
		for (let item of templateItems) {
			if (
				item.querySelector("span").textContent ===
				customTemplates[templateId].title
			) {
				item.click();
				break;
			}
		}

		// Wait again for dynamic form to render
		setTimeout(() => {
			// Find the *last* input field in the dynamic form, assuming it's the main "context/content" field
			// To be smarter, we look for a textarea, or default to the last input.
			const formObj = document.getElementById(
				"dynamic-variables-container",
			);
			if (formObj) {
				const fields =
					formObj.querySelectorAll(
						"input, textarea",
					);
				if (fields.length > 0) {
					const targetField =
						formObj.querySelector(
							"textarea",
						) || fields[fields.length - 1];
					targetField.value = content;
					// Trigger input event to update preview
					targetField.dispatchEvent(
						new Event("input"),
					);
				}
			}
		}, 50);
	}, 50);
}

/**
 * Loads custom templates from localStorage.
 */
function loadCustomTemplates() {
	const saved = localStorage.getItem("pth_custom_templates");
	if (saved) {
		try {
			customTemplates = JSON.parse(saved);
		} catch (e) {
			console.error("Failed to load custom templates", e);
			customTemplates = {};
		}
	}
}

/**
 * Saves custom templates to localStorage.
 */
function saveCustomTemplates() {
	localStorage.setItem(
		"pth_custom_templates",
		JSON.stringify(customTemplates),
	);
}

/**
 * Handles clicks on navigation buttons.
 * @param {Event} event - The click event.
 * @param {NodeList} navButtons - List of all navigation buttons.
 */
function handleNavClick(event, navButtons) {
	const targetId = event.currentTarget.getAttribute("data-target");
	if (!targetId) return;

	// Update active state on buttons
	navButtons.forEach((btn) => {
		btn.classList.remove("active");
		btn.blur();
	});
	event.currentTarget.classList.add("active");

	// Fade out current content
	const contentArea = document.querySelector(".content-area");
	contentArea.style.animation = "fadeOut 0.15s ease-out forwards";

	// Wait for fade out to complete, then swap content and fade in
	setTimeout(() => {
		if (targetId === "custom") {
			isCustomTab = true;
			renderCustomBuilderView();
		} else {
			isCustomTab = false;
			// Clean out any custom dynamic form that might be lingering
			const dContainer = document.getElementById(
				"dynamic-variables-container",
			);
			if (dContainer) dContainer.innerHTML = "";
			updateTemplateView(targetId);
		}

		// Trigger reflow and fade in
		contentArea.style.animation = "none";
		contentArea.offsetHeight;
		contentArea.style.animation = "fadeIn 0.15s ease-in forwards";
	}, 150);
}

/**
 * Renders the custom template builder view.
 */
function renderCustomBuilderView() {
	currentTemplateId = "custom";
	const titleElement = document.getElementById("template-title");
	const formElement = document.getElementById("customization-form");

	if (titleElement) titleElement.textContent = "My Custom Templates";

	formElement.innerHTML = "";

	// Header with Export/Import
	const headerActions = document.createElement("div");
	headerActions.className = "custom-header-actions";

	const listTitle = document.createElement("h3");
	listTitle.textContent = "Saved Templates";
	listTitle.style.color = "var(--text-primary)";

	const headerTools = document.createElement("div");
	headerTools.className = "header-tools";

	const exportBtn = document.createElement("button");
	exportBtn.className = "icon-btn";
	exportBtn.innerHTML =
		'<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>';
	exportBtn.title = "Export Templates (JSON)";
	exportBtn.onclick = exportCustomTemplates;

	const importBtn = document.createElement("button");
	importBtn.className = "icon-btn";
	importBtn.innerHTML =
		'<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>';
	importBtn.title = "Import Templates (JSON)";
	importBtn.onclick = importCustomTemplates;

	headerTools.appendChild(exportBtn);
	headerTools.appendChild(importBtn);
	headerActions.appendChild(listTitle);
	headerActions.appendChild(headerTools);

	formElement.appendChild(headerActions);

	// Render list of existing custom templates
	const listContainer = document.createElement("div");
	listContainer.className = "custom-template-list";

	const templateKeys = Object.keys(customTemplates);
	if (templateKeys.length === 0) {
		listContainer.innerHTML =
			'<div class="empty-state">No custom templates yet. Create one below!</div>';
	} else {
		templateKeys.forEach((key) => {
			const t = customTemplates[key];
			const item = document.createElement("div");
			item.className = "custom-template-item";

			const infoDiv = document.createElement("div");
			infoDiv.className = "template-item-info";

			const nameSpan = document.createElement("span");
			nameSpan.textContent = t.title;
			infoDiv.appendChild(nameSpan);

			if (t.tag) {
				const tagSpan = document.createElement("span");
				tagSpan.className = "template-tag";
				tagSpan.textContent = t.tag;
				infoDiv.appendChild(tagSpan);
			}

			const tools = document.createElement("div");
			tools.className = "custom-template-item-tools";

			const copyBtn = document.createElement("button");
			copyBtn.className = "icon-btn";
			copyBtn.innerHTML =
				'<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
			copyBtn.title = "Copy Template Code";
			copyBtn.onclick = (e) => {
				e.stopPropagation();
				copyToClipboard(t.content, copyBtn);
			};

			const deleteBtn = document.createElement("button");
			deleteBtn.className = "icon-btn delete";
			deleteBtn.innerHTML =
				'<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>';
			deleteBtn.title = "Delete Template";
			deleteBtn.onclick = (e) => {
				e.stopPropagation();
				if (confirm(`Delete template "${t.title}"?`)) {
					delete customTemplates[key];
					saveCustomTemplates();
					renderCustomBuilderView();
				}
			};

			tools.appendChild(copyBtn);
			tools.appendChild(deleteBtn);

			item.appendChild(infoDiv);
			item.appendChild(tools);

			item.onclick = () => {
				// View this template in the preview
				currentTemplateId = key;
				document.querySelectorAll(
					".custom-template-item",
				).forEach((el) =>
					el.classList.remove("active"),
				);
				item.classList.add("active");

				// Parse for variables and render dynamic form
				renderDynamicCustomForm(t);
			};

			listContainer.appendChild(item);
		});
	}

	formElement.appendChild(listContainer);

	// Form to add a new custom template
	const addHeader = document.createElement("h3");
	addHeader.textContent = "Create New Template";
	addHeader.style.marginBottom = "1rem";
	addHeader.style.color = "var(--text-primary)";
	formElement.appendChild(addHeader);

	const titleGroup = createFormGroup(
		"new-title",
		"Template Title",
		"text",
		"e.g., Code Reviewer",
	);
	const tagGroup = createFormGroup(
		"new-tag",
		"Tag (Optional)",
		"text",
		"e.g., Frontend",
	);
	const contentGroup = createFormGroup(
		"new-content",
		"Prompt Content (Markdown supported)",
		"textarea",
		"You are an expert...",
	);

	const saveBtn = document.createElement("button");
	saveBtn.type = "button";
	saveBtn.className = "action-btn";
	saveBtn.textContent = "Save Template";
	saveBtn.onclick = () => {
		const titleInput = document.getElementById("new-title");
		const tagInput = document.getElementById("new-tag");
		const contentInput = document.getElementById("new-content");

		if (!titleInput.value.trim() || !contentInput.value.trim()) {
			alert("Please provide both a title and content.");
			return;
		}

		const id = "custom_" + Date.now();
		customTemplates[id] = {
			title: titleInput.value.trim(),
			tag: tagInput.value.trim() || null,
			content: contentInput.value.trim(),
		};
		saveCustomTemplates();
		renderCustomBuilderView();
	};

	formElement.appendChild(titleGroup);
	formElement.appendChild(tagGroup);
	formElement.appendChild(contentGroup);
	formElement.appendChild(saveBtn);

	// Create a container for dynamic inputs if a template is selected
	const dynamicContainer = document.createElement("div");
	dynamicContainer.id = "dynamic-variables-container";
	dynamicContainer.style.marginTop = "2rem";
	formElement.appendChild(dynamicContainer);

	// clear preview initially on the custom tab
	const codeElement = document.getElementById("template-code");
	codeElement.textContent =
		"Select a custom template above or create a new one to see its content here. Use brackets like [Variable Name] in your content snippet to auto-generate form inputs!";
	highlightCode(codeElement);
}

/**
 * Triggers download of customTemplates as JSON
 */
function exportCustomTemplates() {
	if (Object.keys(customTemplates).length === 0) {
		alert("No custom templates to export.");
		return;
	}
	const dataStr =
		"data:text/json;charset=utf-8," +
		encodeURIComponent(JSON.stringify(customTemplates, null, 2));
	const downloadAnchorNode = document.createElement("a");
	downloadAnchorNode.setAttribute("href", dataStr);
	downloadAnchorNode.setAttribute(
		"download",
		"prompt_templates_backup.json",
	);
	document.body.appendChild(downloadAnchorNode); // required for firefox
	downloadAnchorNode.click();
	downloadAnchorNode.remove();
}

/**
 * Prompts user to upload a JSON file to merge into customTemplates
 */
function importCustomTemplates() {
	const fileInput = document.createElement("input");
	fileInput.type = "file";
	fileInput.accept = ".json";
	fileInput.onchange = (e) => {
		const file = e.target.files[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (event) => {
			try {
				const imported = JSON.parse(
					event.target.result,
				);
				// Basic validation
				if (
					typeof imported !== "object" ||
					Array.isArray(imported)
				)
					throw new Error("Invalid format");

				// Merge
				Object.keys(imported).forEach((key) => {
					// avoid overwriting existing unless user wants to, could be complex, simple merge for now
					if (!customTemplates[key]) {
						customTemplates[key] =
							imported[key];
					} else {
						// Create new ID to avoid clash if it exists
						customTemplates[
							"custom_imported_" +
								Date.now() +
								Math.random()
						] = imported[key];
					}
				});

				saveCustomTemplates();
				renderCustomBuilderView();
				alert("Templates imported successfully!");
			} catch (err) {
				console.error(err);
				alert(
					"Failed to parse JSON file. Make sure it's a valid backup.",
				);
			}
		};
		reader.readAsText(file);
	};
	fileInput.click();
}

/**
 * Parses a custom template for [Variables] and renders a form for them.
 */
function renderDynamicCustomForm(template) {
	const container = document.getElementById(
		"dynamic-variables-container",
	);
	if (!container) return;

	container.innerHTML = "";

	// Find all unique instances of [Variable Name]
	const regex = /\[(.*?)\]/g;
	const matches = [...template.content.matchAll(regex)];
	const variables = [...new Set(matches.map((m) => m[1]))]; // Remove duplicates

	if (variables.length > 0) {
		const header = document.createElement("h3");
		header.textContent = "Template Variables";
		header.style.marginBottom = "1rem";
		header.style.paddingTop = "1rem";
		header.style.borderTop = "1px solid var(--glass-border)";
		header.style.color = "var(--text-primary)";
		container.appendChild(header);

		variables.forEach((v) => {
			const formGroup = createFormGroup(
				"dyn_" + v.replace(/\s+/g, ""),
				v,
				"text",
				`Enter value for ${v}`,
			);
			const input = formGroup.querySelector("input");

			// Try load state
			const savedState = localStorage.getItem(
				`pth_custom_${currentTemplateId}_state`,
			);
			if (savedState) {
				try {
					const parsed = JSON.parse(savedState);
					if (parsed[v]) input.value = parsed[v];
				} catch (e) {}
			}

			input.addEventListener("input", () => {
				saveCustomState(variables);
				updateCustomPreview(template, variables);
			});

			container.appendChild(formGroup);
		});
	}

	// Initial preview setup
	updateCustomPreview(template, variables);
}

/**
 * Updates the code preview for custom templates by replacing [Variables] with form input
 */
function updateCustomPreview(template, variables) {
	let outputText = template.content;
	const values = {};

	variables.forEach((v) => {
		const input = document.getElementById(
			"dyn_" + v.replace(/\s+/g, ""),
		);
		if (input && input.value.trim() !== "") {
			// Replace all instances of literally "[v]" globally
			const replaceRegex = new RegExp(
				`\\[${v.replace(/[.*+?^$\{\}()|\[\]\\]/g, "\\$&")}\\]`,
				"g",
			);
			outputText = outputText.replace(
				replaceRegex,
				input.value,
			);
			values[v] = input.value;
		}
	});

	const codeElement = document.getElementById("template-code");
	codeElement.textContent = outputText;
	highlightCode(codeElement);
}

/**
 * Saves dynamic input values for a custom template to localStorage
 */
function saveCustomState(variables) {
	const values = {};
	variables.forEach((v) => {
		const input = document.getElementById(
			"dyn_" + v.replace(/\s+/g, ""),
		);
		if (input) {
			values[v] = input.value;
		}
	});
	localStorage.setItem(
		`pth_custom_${currentTemplateId}_state`,
		JSON.stringify(values),
	);
}

/**
 * Helper to create form DOM elements
 */
function createFormGroup(id, labelText, type, placeholder) {
	const formGroup = document.createElement("div");
	formGroup.className = "form-group";

	const label = document.createElement("label");
	label.htmlFor = id;
	label.textContent = labelText;
	formGroup.appendChild(label);

	let input;
	if (type === "textarea") {
		input = document.createElement("textarea");
		input.rows = 6;
	} else {
		input = document.createElement("input");
		input.type = type;
	}

	input.id = id;
	input.className = "form-control";
	input.placeholder = placeholder;

	formGroup.appendChild(input);
	return formGroup;
}

/**
 * Updates the DOM with the selected default template's data and forms.
 * @param {string} templateId - The key of the template to display.
 */
function updateTemplateView(templateId) {
	currentTemplateId = templateId;
	const titleElement = document.getElementById("template-title");
	const formElement = document.getElementById("customization-form");
	const templateData = defaultTemplates[templateId];

	if (!templateData) return;

	if (titleElement) {
		titleElement.textContent =
			templateData.title + " Prompt Template";
	}

	if (formElement) {
		formElement.innerHTML = "";
		templateData.fields.forEach((field) => {
			const formGroup = document.createElement("div");
			formGroup.className = "form-group";

			const label = document.createElement("label");
			label.htmlFor = field.id;
			label.textContent = field.label;
			formGroup.appendChild(label);

			let input;
			if (field.type === "textarea") {
				input = document.createElement("textarea");
				input.rows = 4;
			} else {
				input = document.createElement("input");
				input.type = field.type;
			}

			input.id = field.id;
			input.name = field.id;
			input.className = "form-control";
			if (field.placeholder)
				input.placeholder = field.placeholder;

			input.addEventListener("input", () => {
				saveState(templateId);
				updateCodePreview();
			});

			formGroup.appendChild(input);

			// Add suggestion chips if applicable
			if (field.suggestions && field.suggestions.length > 0) {
				const suggestionsContainer =
					document.createElement("div");
				suggestionsContainer.className =
					"suggestions-container";

				field.suggestions.forEach((suggestion) => {
					const chip =
						document.createElement(
							"button",
						);
					chip.type = "button";
					chip.className = "suggestion-chip";
					chip.textContent = suggestion;
					chip.addEventListener("click", () => {
						const currentValue =
							input.value.trim();
						if (currentValue === "") {
							input.value =
								suggestion;
						} else {
							// Smart append if already has text
							const separator =
								field.type ===
								"textarea"
									? "\n"
									: ", ";
							input.value =
								currentValue +
								separator +
								suggestion;
						}

						saveState(templateId);
						updateCodePreview();
					});
					suggestionsContainer.appendChild(chip);
				});

				formGroup.appendChild(suggestionsContainer);
			}

			formElement.appendChild(formGroup);
		});

		// Restore state after fields are built
		loadState(templateId);
	}

	updateCodePreview();
}

/**
 * Saves the current form values for the given template to localStorage.
 */
function saveState(templateId) {
	const templateData = defaultTemplates[templateId];
	if (!templateData) return;

	const values = {};
	templateData.fields.forEach((field) => {
		const input = document.getElementById(field.id);
		if (input) {
			values[field.id] = input.value;
		}
	});

	localStorage.setItem(`pth_${templateId}_state`, JSON.stringify(values));
}

/**
 * Loads the saved form values for the given template from localStorage.
 */
function loadState(templateId) {
	const savedState = localStorage.getItem(`pth_${templateId}_state`);
	if (!savedState) return;

	try {
		const values = JSON.parse(savedState);
		const templateData = defaultTemplates[templateId];

		templateData.fields.forEach((field) => {
			if (values[field.id] !== undefined) {
				const input = document.getElementById(field.id);
				if (input) {
					input.value = values[field.id];
				}
			}
		});
	} catch (e) {
		console.error("Failed to parse saved state", e);
	}
}

/**
 * Reads form values and updates the code preview based on current template generator.
 */
function updateCodePreview() {
	if (isCustomTab) return; // Managed directly in the custom tab logic

	const templateData = defaultTemplates[currentTemplateId];
	if (!templateData) return;

	const values = {};
	templateData.fields.forEach((field) => {
		const input = document.getElementById(field.id);
		if (input) {
			values[field.id] = input.value.trim();
		}
	});

	const codeElement = document.getElementById("template-code");
	if (codeElement) {
		codeElement.textContent = templateData.generate(values);
		highlightCode(codeElement);
	}
}

/**
 * Triggers Prism.js to highlight the code block.
 */
function highlightCode(element) {
	if (window.Prism) {
		Prism.highlightElement(element);
	}
}

/**
 * Handles copying the current template content to the clipboard and saving to history.
 */
function handleCopy() {
	const codeElement = document.getElementById("template-code");
	const copyBtn = document.getElementById("copy-btn");
	if (codeElement && copyBtn) {
		const content = codeElement.textContent;
		copyToClipboard(content, copyBtn);

		// Save to history
		const title =
			document.getElementById("template-title").textContent;
		saveToHistory(title, content);
	}
}

/**
 * Reusable clipboard copy function with visual feedback.
 */
async function copyToClipboard(text, buttonElement) {
	const iconCopy =
		'<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>';
	const iconCheck =
		'<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';

	const btnSpan = buttonElement.querySelector("span") || buttonElement; // Handle icon-only buttons
	const originalText = btnSpan.innerHTML;

	try {
		await navigator.clipboard.writeText(text);

		if (buttonElement.id === "copy-btn") {
			btnSpan.textContent = "Copied!";
			buttonElement.style.background =
				"rgba(35, 134, 54, 0.3)";
			buttonElement.style.borderColor =
				"rgba(35, 134, 54, 0.6)";
		} else {
			buttonElement.innerHTML = iconCheck;
			buttonElement.style.color = "var(--blob-1)"; // green success
		}

		setTimeout(() => {
			if (buttonElement.id === "copy-btn") {
				btnSpan.textContent = "Copy";
				buttonElement.style.background = "";
				buttonElement.style.borderColor = "";
			} else {
				buttonElement.innerHTML = iconCopy;
				buttonElement.style.color = "";
			}
		}, 2000);
	} catch (err) {
		console.error("Failed to copy text: ", err);
		if (buttonElement.id === "copy-btn")
			btnSpan.textContent = "Failed";
		setTimeout(() => {
			if (buttonElement.id === "copy-btn")
				btnSpan.textContent = "Copy";
		}, 2000);
	}
}

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", init);
