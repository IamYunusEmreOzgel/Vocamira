const screens={start:document.querySelector("#start-screen"),quiz:document.querySelector("#quiz-screen"),result:document.querySelector("#result-screen"),error:document.querySelector("#error-screen")};
const startButton=document.querySelector("#start-button");
const nextButton=document.querySelector("#next-button");
const restartButton=document.querySelector("#restart-button");
const changeSettingsButton=document.querySelector("#change-settings-button");
const questionCount=document.querySelector("#question-count");
const scoreText=document.querySelector("#score");
const progressBar=document.querySelector("#progress-bar");
const questionWord=document.querySelector("#question-word");
const answerOptions=document.querySelector("#answer-options");
const feedback=document.querySelector("#feedback");
const finalScore=document.querySelector("#final-score");
const resultMessage=document.querySelector("#result-message");
const questionLimitSelect=document.querySelector("#question-limit");
const categorySelect=document.querySelector("#category-select");
const availableCount=document.querySelector("#available-count");
const setupMessage=document.querySelector("#setup-message");
const difficultyInputs=[...document.querySelectorAll('input[name="difficulty"]')];

const VOCABULARY_FILES=["../data/words-1.json","../data/words-2.json","../data/words-3.json","../data/words-4.json","../data/words-5.json","../data/words-6.json"];
const LEVEL_GROUPS={beginner:["A1","A2"],intermediate:["B1","B2"],mixed:[]};
let words=[],activeWordPool=[],quizWords=[],currentQuestionIndex=0,score=0,answerLocked=false;

function showScreen(name){Object.values(screens).forEach(s=>s.classList.remove("active"));screens[name].classList.add("active");}
function shuffle(items){const copy=[...items];for(let i=copy.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[copy[i],copy[j]]=[copy[j],copy[i]];}return copy;}
function getSelectedDifficulty(){return difficultyInputs.find(input=>input.checked)?.value||"mixed";}
function getFilteredWords(){const difficulty=getSelectedDifficulty();const category=categorySelect.value;const levels=LEVEL_GROUPS[difficulty];return words.filter(word=>(difficulty==="mixed"||levels.includes(word.level))&&(category==="all"||word.category===category));}
function updateSetupSummary(){if(!words.length)return;const filtered=getFilteredWords();const requested=Number(questionLimitSelect.value);availableCount.textContent=`${filtered.length} words`;if(filtered.length<4){setupMessage.textContent="Choose another difficulty or category. At least four words are required.";startButton.disabled=true;return;}startButton.disabled=false;setupMessage.textContent=requested>filtered.length?`This selection supports ${filtered.length} questions. The quiz length will be adjusted automatically.`:"";}
function populateCategories(){[...new Set(words.map(word=>word.category))].sort().forEach(category=>{const option=document.createElement("option");option.value=category;option.textContent=category.charAt(0).toUpperCase()+category.slice(1);categorySelect.appendChild(option);});}

async function loadWords(){try{const responses=await Promise.all(VOCABULARY_FILES.map(file=>fetch(file)));const failed=responses.find(response=>!response.ok);if(failed)throw new Error(`Vocabulary data could not be loaded: ${failed.status}`);const parts=await Promise.all(responses.map(response=>response.json()));const data=parts.flat();if(!Array.isArray(data)||data.length<4)throw new Error("At least four words are required to create a quiz.");words=data;populateCategories();startButton.textContent="Start Game";updateSetupSummary();}catch(error){console.error(error);showScreen("error");}}
function startQuiz(){activeWordPool=getFilteredWords();if(activeWordPool.length<4){updateSetupSummary();return;}const limit=Math.min(Number(questionLimitSelect.value),activeWordPool.length);quizWords=shuffle(activeWordPool).slice(0,limit);currentQuestionIndex=0;score=0;scoreText.textContent="Score: 0";progressBar.style.width="0%";showScreen("quiz");renderQuestion();}
function createAnswerChoices(correctWord){const wrongDefinitions=shuffle(words.filter(word=>word.id!==correctWord.id)).map(word=>word.definition).filter((definition,index,list)=>list.indexOf(definition)===index).slice(0,3);return shuffle([correctWord.definition,...wrongDefinitions]);}
function renderQuestion(){answerLocked=false;feedback.textContent="";feedback.className="feedback";nextButton.classList.add("hidden");answerOptions.innerHTML="";const currentWord=quizWords[currentQuestionIndex];const total=quizWords.length;questionCount.textContent=`Question ${currentQuestionIndex+1} / ${total}`;progressBar.style.width=`${((currentQuestionIndex+1)/total)*100}%`;questionWord.textContent=currentWord.word;createAnswerChoices(currentWord).forEach(definition=>{const button=document.createElement("button");button.type="button";button.className="answer-button";button.textContent=definition;button.addEventListener("click",()=>checkAnswer(button,definition,currentWord.definition));answerOptions.appendChild(button);});}
function checkAnswer(selectedButton,selectedDefinition,correctDefinition){if(answerLocked)return;answerLocked=true;[...answerOptions.querySelectorAll(".answer-button")].forEach(button=>{button.disabled=true;if(button.textContent===correctDefinition)button.classList.add("correct");});if(selectedDefinition===correctDefinition){score++;scoreText.textContent=`Score: ${score}`;feedback.textContent="Correct.";feedback.classList.add("success");}else{selectedButton.classList.add("wrong");feedback.textContent=`Incorrect. The correct definition is: ${correctDefinition}`;feedback.classList.add("error");}nextButton.textContent=currentQuestionIndex===quizWords.length-1?"View Result":"Next Question";nextButton.classList.remove("hidden");}
function goToNextQuestion(){currentQuestionIndex++;if(currentQuestionIndex>=quizWords.length){showResult();return;}renderQuestion();}
function showResult(){const total=quizWords.length;const percentage=Math.round((score/total)*100);finalScore.textContent=`${score} / ${total}`;resultMessage.textContent=percentage===100?"Excellent. You answered every question correctly.":percentage>=70?"Good work. Try another quiz to keep improving.":percentage>=40?"A solid start. Review the words and try again.":"Keep practising. Repetition will make these words easier.";showScreen("result");}
function returnToSettings(){showScreen("start");updateSetupSummary();}
startButton.addEventListener("click",startQuiz);nextButton.addEventListener("click",goToNextQuestion);restartButton.addEventListener("click",startQuiz);changeSettingsButton.addEventListener("click",returnToSettings);questionLimitSelect.addEventListener("change",updateSetupSummary);categorySelect.addEventListener("change",updateSetupSummary);difficultyInputs.forEach(input=>input.addEventListener("change",updateSetupSummary));loadWords();