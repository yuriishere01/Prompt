document.addEventListener('DOMContentLoaded', () => {
    const promptTypeSelect = document.getElementById('promptType');
    const originalPromptInput = document.getElementById('originalPrompt');
    const enhanceBtn = document.getElementById('enhanceBtn');
    const btnText = document.querySelector('.btn-text');
    const btnIcon = document.querySelector('.btn-icon');
    const loader = document.querySelector('.loader');
    const resultSection = document.getElementById('resultSection');
    const enhancedPromptOutput = document.getElementById('enhancedPromptOutput');
    const copyBtn = document.getElementById('copyBtn');

    // Personas mapping based on user selection
    const personas = {
        'website': 'You are a Senior Full-Stack Web Developer, UI/UX Expert, and Technical Architect.',
        'image': 'You are a Master Prompt Engineer, Art Director, and Visual Design Specialist.',
        'video': 'You are a Professional Video Director, Cinematographer, and Animation Specialist.',
        'software': 'You are a Principal Software Engineer, Systems Architect, and Code Quality Expert.',
        'marketing': 'You are a World-Class Copywriter, Marketing Strategist, and Conversion Rate Expert.'
    };

    const frameworks = {
        'website': 'Include structural details, aesthetic style, UI components, target audience, tech stack preferences (if any), and core features. Break down into sections.',
        'image': 'Include lighting, camera angles, color palette, artistic style (e.g., photorealistic, illustration, cyberpunk), subject details, and mood.',
        'video': 'Include scene-by-scene breakdown, camera movements (e.g., pan, zoom), pacing, visual style, lighting, and audio/soundtrack cues.',
        'software': 'Include functional requirements, edge cases, language/framework specifics, performance considerations, and testing criteria.',
        'marketing': 'Include target audience, primary pain points, tone of voice, call to action (CTA), desired emotions, and format (e.g., email, landing page, tweet).'
    };

    enhanceBtn.addEventListener('click', async () => {
        const apiKey = 'AIzaSyDW383iPnf1nz_Rbz355mWpH5gaXV0WE6w';
        const promptType = promptTypeSelect.value;
        const originalPrompt = originalPromptInput.value.trim();

        if (!originalPrompt) {
            alert('Please enter a basic prompt to enhance.');
            originalPromptInput.focus();
            return;
        }

        // UI State: Loading
        enhanceBtn.disabled = true;
        btnText.textContent = 'Enhancing...';
        btnIcon.classList.add('hidden');
        loader.classList.remove('hidden');
        resultSection.classList.add('hidden');

        try {
            const enhancedPrompt = await callGeminiAPI(apiKey, promptType, originalPrompt);
            
            enhancedPromptOutput.textContent = enhancedPrompt.trim();
            resultSection.classList.remove('hidden');
            
            // Scroll to result
            resultSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } catch (error) {
            alert(`Error enhancing prompt: ${error.message}`);
            console.error(error);
        } finally {
            // UI State: Reset
            enhanceBtn.disabled = false;
            btnText.textContent = 'Enhance Prompt';
            btnIcon.classList.remove('hidden');
            loader.classList.add('hidden');
        }
    });

    copyBtn.addEventListener('click', () => {
        const textToCopy = enhancedPromptOutput.textContent;
        navigator.clipboard.writeText(textToCopy).then(() => {
            const originalHTML = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fa-solid fa-check" style="color: #10b981;"></i>';
            setTimeout(() => {
                copyBtn.innerHTML = originalHTML;
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
            alert('Failed to copy to clipboard.');
        });
    });

    async function callGeminiAPI(apiKey, promptType, originalPrompt) {
        const persona = personas[promptType];
        const framework = frameworks[promptType];

        const systemInstruction = `
            ${persona}
            Your task is to take a basic user request and rewrite it into an incredibly detailed, professional-grade prompt that can be fed into an AI system.
            The user wants to generate a: ${promptType.toUpperCase()}.
            
            Follow this framework to structure the enhanced prompt:
            ${framework}

            Instructions for you:
            1. DO NOT output conversational text, greetings, or explanations.
            2. ONLY output the newly constructed, enhanced prompt itself.
            3. Use clear formatting (markdown, bolding, bullet points) to make the resulting prompt easy for another AI to digest.
            4. Add professional insights, missing details, and best practices that a novice might forget to ask for
            5. Seprately fed the AI for the Theme and UI if provided by user if not then give anything you think suits well.
        `;

        const requestBody = {
            contents: [
                {
                    parts: [
                        { text: systemInstruction + "\n\nHere is the user's basic request: " + originalPrompt }
                    ]
                }
            ],
            generationConfig: {
                temperature: 0.7,
                maxOutputTokens: 2048
            }
        };

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`, {
            method: 'POST',                             
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error?.message || 'Failed to connect to Google AI Studio API.');
        }

        const data = await response.json();
        
        if (data.candidates && data.candidates.length > 0 && data.candidates[0].content.parts.length > 0) {
            return data.candidates[0].content.parts[0].text;
        } else {
            throw new Error('Unexpected response format from API.');
        }
    }
});
