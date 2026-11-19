import type { CategoryId } from './categories';

export type Quote = {
  id: string;
  text: string;
  author?: string;
  categories: CategoryId[];
  /** true for quotes the user wrote in the app */
  own?: boolean;
};

type Row = [text: string, author: string | null, categories: CategoryId[]];

/*
 * Two sources only, so the library is ours to ship:
 *  - CLASSIC: public-domain works by authors who died long ago, quoted from
 *    public-domain translations where a translation is involved.
 *  - ORIGINAL: lines written fresh for this app, with no author.
 *
 * IDs are positional (c1, c2... / o1, o2...). Only ever append to these lists,
 * never reorder or delete, or saved favorites will point at the wrong quote.
 */
const CLASSIC: Row[] = [
  ['Such as are your habitual thoughts, such also will be the character of your mind; for the soul is dyed by the thoughts.', 'Marcus Aurelius', ['wisdom', 'growth']],
  ['No longer talk at all about the kind of man that a good man ought to be, but be such.', 'Marcus Aurelius', ['discipline', 'wisdom']],
  ['Very little indeed is necessary for living a happy life.', 'Marcus Aurelius', ['happiness', 'gratitude']],
  ['The best way of avenging yourself is not to become like the wrongdoer.', 'Marcus Aurelius', ['wisdom', 'love']],
  ['Loss is nothing else than change.', 'Marcus Aurelius', ['hard-times', 'wisdom']],
  ['Look round at the courses of the stars, as if you were going along with them.', 'Marcus Aurelius', ['calm']],
  ['Do every act of your life as if it were the last.', 'Marcus Aurelius', ['discipline', 'work']],
  ['Confine yourself to the present.', 'Marcus Aurelius', ['calm']],
  ['We suffer more often in imagination than in reality.', 'Seneca', ['hard-times', 'calm']],
  ['While we are postponing, life speeds by.', 'Seneca', ['work', 'discipline']],
  ['As long as you live, keep learning how to live.', 'Seneca', ['growth', 'wisdom']],
  ['No man was ever wise by chance.', 'Seneca', ['wisdom', 'growth']],
  ['Begin at once to live, and count each separate day as a separate life.', 'Seneca', ['happiness', 'courage']],
  ['If one does not know to which port one is sailing, no wind is favourable.', 'Seneca', ['work']],
  ['Men are disturbed not by the things which happen, but by the opinions about the things.', 'Epictetus', ['calm', 'hard-times']],
  ['First say to yourself what you would be; and then do what you have to do.', 'Epictetus', ['discipline', 'work']],
  ['No man is free who is not master of himself.', 'Epictetus', ['discipline']],
  ['If you wish to be a writer, write.', 'Epictetus', ['work', 'courage']],
  ['A journey of a thousand miles begins with a single step.', 'Lao Tzu', ['courage', 'growth']],
  ['He who knows others is wise; he who knows himself is enlightened.', 'Lao Tzu', ['wisdom', 'self-worth']],
  ['When you know a thing, to hold that you know it; and when you do not know a thing, to allow that you do not know it; this is knowledge.', 'Confucius', ['wisdom']],
  ['Nothing great was ever achieved without enthusiasm.', 'Ralph Waldo Emerson', ['work', 'happiness']],
  ['Trust thyself: every heart vibrates to that iron string.', 'Ralph Waldo Emerson', ['self-worth', 'courage']],
  ['Finish each day and be done with it. You have done what you could.', 'Ralph Waldo Emerson', ['calm', 'hard-times']],
  ['Adopt the pace of nature: her secret is patience.', 'Ralph Waldo Emerson', ['calm', 'growth']],
  ['If one advances confidently in the direction of his dreams, and endeavors to live the life which he has imagined, he will meet with a success unexpected in common hours.', 'Henry David Thoreau', ['courage', 'work']],
  ['It is not enough to be industrious; so are the ants. What are you industrious about?', 'Henry David Thoreau', ['work']],
  ['Our life is frittered away by detail. Simplify, simplify.', 'Henry David Thoreau', ['calm']],
  ['Do what you can, with what you have, where you are.', 'Theodore Roosevelt', ['hard-times', 'discipline']],
  ['The credit belongs to the man who is actually in the arena.', 'Theodore Roosevelt', ['courage']],
  ['Well done is better than well said.', 'Benjamin Franklin', ['work', 'discipline']],
  ['Lost time is never found again.', 'Benjamin Franklin', ['work']],
  ['The two most powerful warriors are patience and time.', 'Leo Tolstoy', ['hard-times', 'growth']],
  ['Although the world is full of suffering, it is full also of the overcoming of it.', 'Helen Keller', ['hard-times', 'courage']],
  ['Optimism is the faith that leads to achievement.', 'Helen Keller', ['happiness', 'work']],
  ['I exist as I am, that is enough.', 'Walt Whitman', ['self-worth']],
  ['The unexamined life is not worth living.', 'Socrates', ['wisdom', 'growth']],
  ['Character is destiny.', 'Heraclitus', ['wisdom']],
  ['There is nothing either good or bad, but thinking makes it so.', 'William Shakespeare', ['calm', 'wisdom']],
  ['Our doubts are traitors, and make us lose the good we oft might win by fearing to attempt.', 'William Shakespeare', ['courage']],
  ['This above all: to thine own self be true.', 'William Shakespeare', ['self-worth']],
  ['We know what we are, but know not what we may be.', 'William Shakespeare', ['growth']],
  ['There is no charm equal to tenderness of heart.', 'Jane Austen', ['love']],
  ['I am no bird; and no net ensnares me.', 'Charlotte Brontë', ['self-worth', 'courage']],
  ["I'm not afraid of storms, for I'm learning how to sail my ship.", 'Louisa May Alcott', ['hard-times', 'courage']],
  ['Hope is the thing with feathers that perches in the soul.', 'Emily Dickinson', ['hard-times', 'happiness']],
  ['I dwell in Possibility.', 'Emily Dickinson', ['growth', 'happiness']],
  ['The mountains are calling and I must go.', 'John Muir', ['happiness', 'calm']],
  ['Be pitiful, for every man is fighting a hard battle.', 'Ian Maclaren', ['love', 'hard-times']],
  ['All that we are is the result of what we have thought.', 'The Dhammapada', ['wisdom', 'growth']],
  ['Hatred does not cease by hatred, but only by love; this is the eternal rule.', 'The Dhammapada', ['love', 'wisdom']],
  ['Better than a thousand hollow words is one word that brings peace.', 'The Dhammapada', ['calm', 'love']],
  ['Do not spoil what you have by desiring what you have not.', 'Epicurus', ['gratitude']],
  ['No act of kindness, no matter how small, is ever wasted.', 'Aesop', ['love', 'gratitude']],
  ['Gratitude is not only the greatest of virtues, but the parent of all the others.', 'Cicero', ['gratitude']],
  ['No one is useless in this world who lightens the burden of it for any one else.', 'Charles Dickens', ['love']],
  ['Into each life some rain must fall.', 'Henry Wadsworth Longfellow', ['hard-times']],
  ["Why, sometimes I've believed as many as six impossible things before breakfast.", 'Lewis Carroll', ['happiness', 'courage']],
  ['The busy bee has no time for sorrow.', 'William Blake', ['work']],
];

const ORIGINAL: Row[] = [
  // hard days
  ["You don't have to feel ready. You only have to take the next small step.", null, ['hard-times', 'courage']],
  ['This is a chapter, not the whole book.', null, ['hard-times']],
  ['Heavy days still end. Hold on until the evening.', null, ['hard-times']],
  ['Rest is not quitting. Rest is how you come back.', null, ['hard-times', 'calm']],
  ['You have survived every hard day so far. That record is not an accident.', null, ['hard-times', 'self-worth']],
  ['Some seasons are for growing. Some are for staying rooted. Both count.', null, ['hard-times', 'growth']],
  ["It's okay to move slowly. You are still moving.", null, ['hard-times', 'growth']],
  ['Breathe out the part of today you cannot fix.', null, ['hard-times', 'calm']],
  ['The storm is loud, but it is not permanent.', null, ['hard-times']],
  ['Asking for help is a skill, not a weakness.', null, ['hard-times', 'courage']],
  // self-worth
  ['You are allowed to take up space.', null, ['self-worth']],
  ['Your worth was never up for negotiation.', null, ['self-worth']],
  ['Speak to yourself like someone you love.', null, ['self-worth', 'love']],
  ["You don't need to earn rest, kindness, or a second chance.", null, ['self-worth', 'calm']],
  ['Unfinished is not the same as not enough.', null, ['self-worth', 'growth']],
  ["Stop shrinking to fit places you've outgrown.", null, ['self-worth', 'growth']],
  ['The people who matter will meet you where you are.', null, ['self-worth', 'love']],
  ['Your pace is not a verdict on your value.', null, ['self-worth']],
  ['You can be proud of yourself and still be growing.', null, ['self-worth', 'growth']],
  ['Not everyone will understand you. You still get to be you.', null, ['self-worth', 'courage']],
  // discipline
  ['Motivation starts the engine. Habit keeps it running.', null, ['discipline']],
  ['Do it tired. Do it unsure. Just do the next rep.', null, ['discipline']],
  ['Small things, done daily, quietly become big things.', null, ['discipline', 'growth']],
  ['Discipline is remembering what you want most, not what you want now.', null, ['discipline']],
  ["Show up on the boring days. That's where it's decided.", null, ['discipline', 'work']],
  ['Make it easy to start and hard to skip.', null, ['discipline']],
  ["A plan you follow beats a perfect plan you don't.", null, ['discipline', 'work']],
  ['Two minutes of effort is more than zero. Begin there.', null, ['discipline']],
  ["You won't always feel like it. Do it anyway, then feel proud.", null, ['discipline']],
  ['Consistency is a promise you keep to your future self.', null, ['discipline']],
  // calm
  ['Not every thought deserves an answer.', null, ['calm']],
  ['Unclench your jaw. Drop your shoulders. Take one slow breath.', null, ['calm']],
  ['Pause before you pour yourself into one more thing.', null, ['calm']],
  ['Let this moment be enough, just for now.', null, ['calm', 'gratitude']],
  ['Peace is not the absence of noise. It is choosing where to listen.', null, ['calm', 'wisdom']],
  ['What is meant for you will not need to be chased in a panic.', null, ['calm']],
  ['Slow is not behind. Slow is deliberate.', null, ['calm', 'growth']],
  ['You do not have to solve your whole life tonight.', null, ['calm', 'hard-times']],
  ['Quiet mornings are a kind of medicine.', null, ['calm', 'happiness']],
  ['Notice five things you can see. You are here. You are safe.', null, ['calm']],
  // gratitude
  ['Somewhere, someone is hoping for the life you call ordinary.', null, ['gratitude']],
  ['Count the small wins. They add up to a life.', null, ['gratitude', 'growth']],
  ['Today has at least one good thing in it. Go find it.', null, ['gratitude', 'happiness']],
  ['Thank the people who make ordinary days lighter.', null, ['gratitude', 'love']],
  ['Coffee, sunlight, a kind text. Not small at all.', null, ['gratitude', 'happiness']],
  ["Notice what's going right. It's been there all along.", null, ['gratitude']],
  ['A grateful heart finds more to be grateful for.', null, ['gratitude']],
  ['The present is the only place joy can reach you.', null, ['gratitude', 'calm']],
  // courage
  ['Do it scared. Courage was never the absence of fear.', null, ['courage']],
  ["Fear is a sign you're near something that matters.", null, ['courage']],
  ['Say the honest thing, kindly.', null, ['courage', 'love']],
  ["Bet on yourself. You've seen what you can do.", null, ['courage', 'self-worth']],
  ['One brave hour can change a whole year.', null, ['courage']],
  ['Let them doubt. Let your work answer.', null, ['courage', 'work']],
  ['You can be nervous and still go first.', null, ['courage']],
  ["The door you're scared to knock on might open.", null, ['courage']],
  // love & people
  ['The right people feel like home, not homework.', null, ['love']],
  ['Love is a thousand small attentions.', null, ['love']],
  ['Choose people who choose you back.', null, ['love', 'self-worth']],
  ['Protect your peace without closing your heart.', null, ['love', 'calm']],
  ['Call the friend you keep thinking about.', null, ['love', 'gratitude']],
  ['Kindness costs nothing and is remembered for years.', null, ['love']],
  ['Being loved starts with being honest about who you are.', null, ['love', 'self-worth']],
  ['Good boundaries make room for better love.', null, ['love']],
  // focus & work
  ["Focus on one thing until it's done. Then pick the next.", null, ['work', 'discipline']],
  ["Start before you're good. That's how you get good.", null, ['work', 'courage']],
  ['Your future is built in the hours no one is watching.', null, ['work', 'discipline']],
  ['Done is a gift. Perfect is a trap.', null, ['work']],
  ['Work hard on what you control and let the rest go.', null, ['work', 'calm']],
  ['Ambition needs a calendar, not just a dream.', null, ['work', 'discipline']],
  ['Every expert you admire was once confused, too.', null, ['work', 'growth']],
  ["Make today's work something tomorrow's you will thank.", null, ['work']],
  ['Quiet the noise. Do the work. Let the results talk.', null, ['work']],
  ['Most success is the nerve to keep going after the first no.', null, ['work', 'courage']],
  // growth
  ['Who you were yesterday is a starting point, not a sentence.', null, ['growth']],
  ["Outgrowing things is a sign you're alive.", null, ['growth']],
  ["Every mistake is a lesson you only pay for once, if you're paying attention.", null, ['growth', 'wisdom']],
  ['Growth often feels like discomfort before it feels like progress.', null, ['growth']],
  ['Read more. Listen more. Assume less.', null, ['growth', 'wisdom']],
  ["Stay curious. It's the cheapest way to stay young.", null, ['growth', 'happiness']],
  ['You can start again as many times as it takes.', null, ['growth', 'hard-times']],
  ['Be patient with your becoming.', null, ['growth', 'self-worth']],
  // joy
  ["Joy is often hiding in the plans you didn't make.", null, ['happiness']],
  ["Dance in the kitchen. Nobody's grading it.", null, ['happiness']],
  ['Make room for the things that make you lose track of time.', null, ['happiness']],
  ['Go outside. Look up. Remember how big the world is.', null, ['happiness', 'calm']],
  ['Laugh at yourself a little more today.', null, ['happiness']],
  ['Find the people who make your shoulders drop and your face hurt from smiling.', null, ['happiness', 'love']],
  ["Your life doesn't have to look good. It has to feel good to live.", null, ['happiness', 'self-worth']],
  ['Choose one thing today just because it makes you happy.', null, ['happiness']],
];

export const QUOTES: Quote[] = [
  ...CLASSIC.map(([text, author, categories], i) => ({
    id: `c${i + 1}`,
    text,
    author: author ?? undefined,
    categories,
  })),
  ...ORIGINAL.map(([text, author, categories], i) => ({
    id: `o${i + 1}`,
    text,
    author: author ?? undefined,
    categories,
  })),
];

const quoteById = new Map(QUOTES.map((q) => [q.id, q]));

export function getBuiltInQuote(id: string): Quote | undefined {
  return quoteById.get(id);
}

export function countFor(category: CategoryId): number {
  return QUOTES.filter((q) => q.categories.includes(category)).length;
}
