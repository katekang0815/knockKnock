import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Curated verse pools. Tapping "Look for verses" uses pick + reflection: the AI
 * chooses a reference from the used-filtered pool and the app renders its own
 * exact text (accuracy stays app-controlled). All four major categories are
 * populated, so every category uses the curated path.
 *
 * Text is World English Bible (WEB, public domain), divine name rendered as
 * "the LORD" for the teen/young-adult audience. References use ASCII hyphens for
 * ranges so extractVerse (home card) parses them.
 *
 * NOTE: Stormy was reviewed; Rain / Breezy / Sunny were filled from WEB and
 * should be verified against an authoritative WEB source before public launch.
 */

export interface Verse {
  ref: string;
  text: string;
}

// Emotions per major category (must match constants/emotions.ts labels).
const CATEGORY_EMOTIONS: Record<string, string[]> = {
  Stormy: [
    'Anxious', 'Stressed', 'Overwhelmed', 'Worried', 'Annoyed', 'Frustrated',
    'Nervous', 'Scared', 'Confused', 'Embarrassed', 'Irritated', 'Jealous',
    'Furious', 'Shocked', 'Tense',
  ],
  Rain: [
    'Sad', 'Discouraged', 'Bored', 'Lonely', 'Excluded', 'Depressed',
    'Disappointed', 'Exhausted', 'Lost', 'Insecure', 'Despair', 'Guilty',
    'Ashamed', 'Numb', 'Vulnerable', 'Burned Out',
  ],
  Breezy: [
    'Loved', 'Good', 'Chill', 'Compassionate', 'Supported', 'Blessed',
    'Included', 'Valued', 'Safe', 'Fulfilled', 'Content', 'Connected',
    'Appreciated', 'Relieved', 'Understood',
  ],
  Sunny: [
    'Optimistic', 'Alive', 'Surprised', 'Accomplished', 'Proud', 'Curious',
    'Hopeful', 'Motivated', 'Confident', 'Inspired', 'Eager', 'Focused',
    'Excited', 'Thrilled', 'Joyful', 'Determined',
  ],
};

const VERSES: Record<string, Verse[]> = {
  // ---- Stormy (reviewed) --------------------------------------------------
  Furious: [
    { ref: 'Ephesians 4:26', text: "Be angry, and don't sin. Don't let the sun go down on your wrath." },
    { ref: 'Psalm 103:8', text: 'The LORD is merciful and gracious, slow to anger, and abundant in loving kindness.' },
    { ref: 'Romans 12:19', text: "Don't seek revenge yourselves, beloved, but give place to God's wrath. For it is written, 'Vengeance belongs to me; I will repay, says the Lord.'" },
  ],
  Annoyed: [
    { ref: 'Proverbs 19:11', text: 'The discretion of a man makes him slow to anger. It is his glory to overlook an offense.' },
    { ref: 'Proverbs 16:32', text: 'One who is slow to anger is better than the mighty; one who rules his spirit, than he who takes a city.' },
    { ref: 'Colossians 3:13', text: 'bearing with one another, and forgiving each other, if any man has a complaint against any; even as Christ forgave you, so you also do.' },
  ],
  Irritated: [
    { ref: 'Proverbs 15:1', text: 'A gentle answer turns away wrath, but a harsh word stirs up anger.' },
    { ref: 'James 1:19', text: 'let every man be swift to hear, slow to speak, and slow to anger;' },
    { ref: 'Ephesians 4:31-32', text: 'Let all bitterness, wrath, anger, outcry, and slander be put away from you, with all malice. And be kind to one another, tenderhearted, forgiving each other, just as God also in Christ forgave you.' },
  ],
  Scared: [
    { ref: 'Psalm 23:4', text: 'Even though I walk through the valley of the shadow of death, I will fear no evil, for you are with me. Your rod and your staff, they comfort me.' },
    { ref: 'Psalm 27:1', text: 'The LORD is my light and my salvation. Whom shall I fear? The LORD is the strength of my life. Of whom shall I be afraid?' },
    { ref: 'Isaiah 41:13', text: "For I, the LORD your God, will hold your right hand, saying to you, 'Don't be afraid. I will help you.'" },
  ],
  Nervous: [
    { ref: 'Joshua 1:9', text: "Haven't I commanded you? Be strong and courageous. Don't be afraid. Don't be dismayed, for the LORD your God is with you wherever you go." },
    { ref: 'Isaiah 41:10', text: "Don't be afraid, for I am with you. Don't be dismayed, for I am your God. I will strengthen you. Yes, I will help you. Yes, I will uphold you with the right hand of my righteousness." },
    { ref: '2 Timothy 1:7', text: "For God didn't give us a spirit of fear, but of power, love, and self-control." },
  ],
  Worried: [
    { ref: 'Matthew 6:25-27', text: "Therefore don't be anxious for your life: what you will eat, or what you will drink; nor yet for your body, what you will wear. Isn't life more than food, and the body more than clothing? See the birds of the sky, that they don't sow, neither do they reap, nor gather into barns. Your heavenly Father feeds them. Aren't you of much more value than they?" },
    { ref: 'Psalm 94:19', text: 'In the multitude of my thoughts within me, your comforts delight my soul.' },
    { ref: 'John 14:27', text: "Peace I leave with you. My peace I give to you; not as the world gives, give I to you. Don't let your heart be troubled, neither let it be fearful." },
  ],
  Tense: [
    { ref: 'Isaiah 26:3', text: "You will keep whoever's mind is steadfast in perfect peace, because he trusts in you." },
    { ref: 'Psalm 46:10', text: 'Be still, and know that I am God. I will be exalted among the nations. I will be exalted in the earth.' },
    { ref: 'Matthew 11:28', text: 'Come to me, all you who labor and are heavily burdened, and I will give you rest.' },
  ],
  Anxious: [
    { ref: 'Philippians 4:6-7', text: 'In nothing be anxious, but in everything, by prayer and petition with thanksgiving, let your requests be made known to God. And the peace of God, which surpasses all understanding, will guard your hearts and your thoughts in Christ Jesus.' },
    { ref: '1 Peter 5:7', text: 'casting all your worries on him, because he cares for you.' },
    { ref: 'Matthew 6:34', text: "Therefore don't be anxious for tomorrow, for tomorrow will be anxious for itself. Each day's own evil is sufficient." },
  ],
  Stressed: [
    { ref: 'Psalm 55:22', text: 'Cast your burden on the LORD and he will sustain you. He will never allow the righteous to be moved.' },
    { ref: 'Psalm 61:2', text: 'From the end of the earth, I will call to you when my heart is overwhelmed. Lead me to the rock that is higher than I.' },
    { ref: 'Exodus 33:14', text: "He said, 'My presence will go with you, and I will give you rest.'" },
  ],
  Frustrated: [
    { ref: 'Galatians 6:9', text: "Let us not be weary in doing good, for we will reap in due season, if we don't give up." },
    { ref: 'Proverbs 3:5-6', text: "Trust in the LORD with all your heart, and don't lean on your own understanding. In all your ways acknowledge him, and he will make your paths straight." },
    { ref: 'Isaiah 40:31', text: 'but those who wait for the LORD will renew their strength. They will mount up with wings like eagles. They will run, and not be weary. They will walk, and not faint.' },
  ],
  Shocked: [
    { ref: 'Psalm 46:1', text: 'God is our refuge and strength, a very present help in trouble.' },
    { ref: '2 Corinthians 4:8-9', text: 'We are pressed on every side, yet not crushed; perplexed, yet not to despair; pursued, yet not forsaken; struck down, yet not destroyed;' },
    { ref: 'Isaiah 43:2', text: 'When you pass through the waters, I will be with you, and through the rivers, they will not overflow you. When you walk through the fire, you will not be burned, and flame will not scorch you.' },
  ],
  Overwhelmed: [
    { ref: 'Psalm 42:11', text: 'Why are you in despair, my soul? Why are you disturbed within me? Hope in God! For I shall still praise him, the saving help of my countenance, and my God.' },
    { ref: '2 Corinthians 12:9', text: "He has said to me, 'My grace is sufficient for you, for my power is made perfect in weakness.' Most gladly therefore I will rather glory in my weaknesses, that the power of Christ may rest on me." },
    { ref: 'Psalm 18:16', text: 'He sent from on high. He took me. He drew me out of many waters.' },
  ],
  Jealous: [
    { ref: '1 Corinthians 13:4', text: "Love is patient and is kind. Love doesn't envy. Love doesn't brag, is not proud," },
    { ref: 'Psalm 139:14', text: 'I will give thanks to you, for I am fearfully and wonderfully made. Your works are wonderful, and my soul knows that very well.' },
    { ref: 'Galatians 6:4', text: 'But let each man examine his own work, and then he will have reason for boasting in himself alone, and not in someone else.' },
    { ref: 'Galatians 5:26', text: "Let's not become conceited, provoking one another, and envying one another." },
    { ref: 'Psalm 37:1', text: "Don't fret because of evildoers, neither be envious against those who work unrighteousness." },
    { ref: 'Philippians 4:11', text: 'I have learned, in whatever state I am, to be content in it.' },
  ],
  Embarrassed: [
    { ref: 'Psalm 34:5', text: 'They looked to him, and were radiant. Their faces shall never be covered with shame.' },
    { ref: 'Romans 10:11', text: "For the Scripture says, 'Whoever believes in him will not be disappointed.'" },
    { ref: 'Isaiah 54:4', text: "Don't be afraid, for you will not be ashamed. Don't be confounded, for you will not be disappointed. For you will forget the shame of your youth." },
    { ref: 'Psalm 25:3', text: 'Yes, no one who waits for you will be shamed.' },
    { ref: 'Romans 8:1', text: 'There is therefore now no condemnation to those who are in Christ Jesus.' },
    { ref: 'Hebrews 4:16', text: "Let's therefore draw near with boldness to the throne of grace, that we may receive mercy, and may find grace for help in time of need." },
  ],
  Confused: [
    { ref: 'James 1:5', text: 'But if any of you lacks wisdom, let him ask of God, who gives to all liberally and without reproach, and it will be given to him.' },
    { ref: '1 Corinthians 14:33', text: 'for God is not a God of confusion, but of peace.' },
    { ref: 'Psalm 119:105', text: 'Your word is a lamp to my feet, and a light for my path.' },
    { ref: 'Proverbs 16:9', text: "A man's heart plans his course, but the LORD directs his steps." },
    { ref: 'Isaiah 30:21', text: "When you turn to the right hand, and when you turn to the left, your ears will hear a voice behind you, saying, 'This is the way. Walk in it.'" },
    { ref: 'Psalm 32:8', text: 'I will instruct you and teach you in the way which you shall go. I will counsel you with my eye on you.' },
  ],

  // ---- Rain (filled from WEB; verify before launch) -----------------------
  Sad: [
    { ref: 'Psalm 34:18', text: 'The LORD is near to those who have a broken heart, and saves those who have a crushed spirit.' },
    { ref: 'Psalm 30:5', text: 'Weeping may stay for the night, but joy comes in the morning.' },
    { ref: 'Matthew 5:4', text: 'Blessed are those who mourn, for they shall be comforted.' },
  ],
  Discouraged: [
    { ref: 'Deuteronomy 31:6', text: "Be strong and courageous. Don't be afraid, for the LORD your God himself goes with you. He will not fail you nor forsake you." },
    { ref: 'Psalm 42:5', text: 'Why are you in despair, my soul? Why are you disturbed within me? Hope in God! For I shall still praise him for the saving help of his presence.' },
    { ref: 'Psalm 3:3', text: 'But you, the LORD, are a shield around me, my glory, and the one who lifts up my head.' },
  ],
  Bored: [
    { ref: 'Colossians 3:23', text: 'Whatever you do, work heartily, as for the Lord, and not for men,' },
    { ref: 'Jeremiah 29:11', text: 'For I know the thoughts that I think toward you, says the LORD, thoughts of peace, and not of evil, to give you hope and a future.' },
    { ref: 'Ecclesiastes 3:1', text: 'For everything there is a season, and a time for every purpose under heaven.' },
  ],
  Lonely: [
    { ref: 'Psalm 68:6', text: 'God sets the lonely in families.' },
    { ref: 'Hebrews 13:5', text: "Be content with such things as you have, for he has said, 'I will in no way leave you, neither will I in any way forsake you.'" },
    { ref: 'Matthew 28:20', text: 'Behold, I am with you always, even to the end of the age.' },
  ],
  Excluded: [
    { ref: 'Psalm 27:10', text: 'When my father and my mother forsake me, then the LORD will take me up.' },
    { ref: '1 Peter 2:9', text: "But you are a chosen race, a royal priesthood, a holy nation, a people for God's own possession, that you may proclaim the excellence of him who called you out of darkness into his marvelous light." },
    { ref: 'John 6:37', text: 'He who comes to me I will in no way throw out.' },
  ],
  Depressed: [
    { ref: 'Psalm 40:1-2', text: 'I waited patiently for the LORD. He turned to me, and heard my cry. He brought me up also out of a horrible pit, out of the miry clay. He set my feet on a rock, and gave me a firm place to stand.' },
    { ref: 'Psalm 34:17', text: 'The righteous cry, and the LORD hears, and delivers them out of all their troubles.' },
    { ref: 'Isaiah 43:2', text: 'When you pass through the waters, I will be with you, and through the rivers, they will not overflow you.' },
  ],
  Disappointed: [
    { ref: 'Romans 5:5', text: "and hope doesn't disappoint us, because God's love has been poured into our hearts through the Holy Spirit who was given to us." },
    { ref: 'Proverbs 13:12', text: 'Hope deferred makes the heart sick, but when longing is fulfilled, it is a tree of life.' },
    { ref: 'Psalm 62:5', text: 'My soul, wait in silence for God alone, for my expectation is from him.' },
  ],
  Exhausted: [
    { ref: 'Matthew 11:28', text: 'Come to me, all you who labor and are heavily burdened, and I will give you rest.' },
    { ref: 'Isaiah 40:31', text: 'those who wait for the LORD will renew their strength. They will mount up with wings like eagles. They will run, and not be weary. They will walk, and not faint.' },
    { ref: 'Psalm 127:2', text: 'It is vain for you to rise up early, to stay up late, eating the bread of toil, for he gives sleep to his loved ones.' },
  ],
  Lost: [
    { ref: 'Psalm 23:3', text: 'He restores my soul. He guides me in the paths of righteousness for his name’s sake.' },
    { ref: 'Luke 19:10', text: 'For the Son of Man came to seek and to save that which was lost.' },
    { ref: 'John 14:6', text: "Jesus said to him, 'I am the way, the truth, and the life. No one comes to the Father, except through me.'" },
  ],
  Insecure: [
    { ref: 'Psalm 139:14', text: 'I will give thanks to you, for I am fearfully and wonderfully made. Your works are wonderful, and my soul knows that very well.' },
    { ref: 'Ephesians 2:10', text: 'For we are his workmanship, created in Christ Jesus for good works, which God prepared before that we would walk in them.' },
    { ref: 'Zephaniah 3:17', text: 'The LORD your God is among you, a mighty one who will save. He will rejoice over you with joy. He will calm you in his love. He will rejoice over you with singing.' },
  ],
  Despair: [
    { ref: 'Lamentations 3:22-23', text: "It is because of the LORD's loving kindnesses that we are not consumed, because his compassion doesn't fail. They are new every morning; great is your faithfulness." },
    { ref: 'Romans 15:13', text: 'Now may the God of hope fill you with all joy and peace in believing, that you may abound in hope in the power of the Holy Spirit.' },
    { ref: 'Psalm 130:5', text: 'I wait for the LORD. My soul waits. I hope in his word.' },
  ],
  Guilty: [
    { ref: '1 John 1:9', text: 'If we confess our sins, he is faithful and righteous to forgive us the sins, and to cleanse us from all unrighteousness.' },
    { ref: 'Psalm 103:12', text: 'As far as the east is from the west, so far has he removed our transgressions from us.' },
    { ref: 'Isaiah 1:18', text: "'Though your sins are as scarlet, they shall be as white as snow. Though they are red like crimson, they shall be as wool,' says the LORD." },
  ],
  Ashamed: [
    { ref: 'Psalm 34:5', text: 'They looked to him, and were radiant. Their faces shall never be covered with shame.' },
    { ref: 'Isaiah 61:7', text: 'Instead of your shame you will have double; and instead of dishonor you will rejoice in your portion. Everlasting joy will be yours.' },
    { ref: '2 Timothy 1:12', text: 'Yet I am not ashamed, for I know him whom I have believed, and I am persuaded that he is able to guard that which I have committed to him against that day.' },
  ],
  Numb: [
    { ref: 'Ezekiel 36:26', text: 'I will give you a new heart, and I will put a new spirit within you. I will take away the stony heart out of your flesh, and I will give you a heart of flesh.' },
    { ref: 'Psalm 42:1-2', text: 'As the deer pants for the water brooks, so my soul pants after you, God. My soul thirsts for God, for the living God.' },
    { ref: 'Psalm 51:10', text: 'Create in me a clean heart, O God. Renew a right spirit within me.' },
  ],
  Vulnerable: [
    { ref: '2 Corinthians 12:9', text: "He has said to me, 'My grace is sufficient for you, for my power is made perfect in weakness.'" },
    { ref: 'Psalm 46:1', text: 'God is our refuge and strength, a very present help in trouble.' },
    { ref: 'Psalm 91:4', text: 'He will cover you with his feathers. Under his wings you will take refuge. His faithfulness is your shield and rampart.' },
  ],
  'Burned Out': [
    { ref: 'Matthew 11:29', text: 'Take my yoke upon you and learn from me, for I am gentle and humble in heart; and you will find rest for your souls.' },
    { ref: 'Psalm 23:2-3', text: 'He makes me lie down in green pastures. He leads me beside still waters. He restores my soul.' },
    { ref: 'Isaiah 40:29', text: 'He gives power to the weak. He increases the strength of him who has no might.' },
  ],

  // ---- Breezy (filled from WEB; verify before launch) ---------------------
  Loved: [
    { ref: 'Romans 8:38-39', text: "For I am persuaded that neither death, nor life, nor things present, nor things to come, nor any other created thing, will be able to separate us from God's love which is in Christ Jesus our Lord." },
    { ref: '1 John 4:16', text: 'God is love, and he who remains in love remains in God, and God remains in him.' },
  ],
  Good: [
    { ref: 'Psalm 34:8', text: 'Oh taste and see that the LORD is good. Blessed is the man who takes refuge in him.' },
    { ref: 'James 1:17', text: 'Every good gift and every perfect gift is from above, coming down from the Father of lights.' },
  ],
  Chill: [
    { ref: 'Psalm 23:2', text: 'He makes me lie down in green pastures. He leads me beside still waters.' },
    { ref: 'Psalm 4:8', text: 'In peace I will both lie down and sleep, for you, the LORD alone, make me live in safety.' },
  ],
  Compassionate: [
    { ref: 'Colossians 3:12', text: "Put on therefore, as God's chosen ones, a heart of compassion, kindness, lowliness, humility, and perseverance;" },
    { ref: 'Luke 6:36', text: 'Therefore be merciful, even as your Father is also merciful.' },
  ],
  Supported: [
    { ref: 'Psalm 18:35', text: 'You have also given me the shield of your salvation. Your right hand sustains me.' },
    { ref: 'Isaiah 41:10', text: "Don't be afraid, for I am with you. I will strengthen you. Yes, I will help you. Yes, I will uphold you with the right hand of my righteousness." },
  ],
  Blessed: [
    { ref: 'Numbers 6:24-26', text: 'The LORD bless you, and keep you. The LORD make his face to shine on you, and be gracious to you. The LORD lift up his face toward you, and give you peace.' },
    { ref: 'Ephesians 1:3', text: 'Blessed be the God and Father of our Lord Jesus Christ, who has blessed us with every spiritual blessing in the heavenly places in Christ.' },
  ],
  Included: [
    { ref: '1 Corinthians 12:27', text: 'Now you are the body of Christ, and members individually.' },
    { ref: 'Ephesians 2:19', text: 'So then you are no longer strangers and foreigners, but you are fellow citizens with the saints and of the household of God.' },
  ],
  Valued: [
    { ref: 'Luke 12:7', text: "The very hairs of your head are all counted. Don't be afraid. You are of more value than many sparrows." },
    { ref: 'Isaiah 43:4', text: 'Since you have been precious and honored in my sight, and I have loved you.' },
  ],
  Safe: [
    { ref: 'Proverbs 18:10', text: "The LORD's name is a strong tower: the righteous run to him, and are safe." },
    { ref: 'Psalm 46:1', text: 'God is our refuge and strength, a very present help in trouble.' },
  ],
  Fulfilled: [
    { ref: 'Psalm 107:9', text: 'For he satisfies the longing soul. He fills the hungry soul with good.' },
    { ref: 'John 10:10', text: 'I came that they may have life, and may have it abundantly.' },
  ],
  Content: [
    { ref: 'Philippians 4:11-12', text: 'I have learned, in whatever state I am, to be content in it. I know how to be humbled, and I know also how to abound.' },
    { ref: '1 Timothy 6:6', text: 'But godliness with contentment is great gain.' },
  ],
  Connected: [
    { ref: 'Ecclesiastes 4:9-10', text: 'Two are better than one, because they have a good reward for their labor. For if they fall, the one will lift up his fellow.' },
    { ref: 'John 15:5', text: 'I am the vine. You are the branches. He who remains in me and I in him bears much fruit.' },
  ],
  Appreciated: [
    { ref: '1 Thessalonians 5:11', text: 'Therefore exhort one another, and build each other up, even as you also do.' },
    { ref: 'Philippians 1:3', text: 'I thank my God whenever I remember you.' },
  ],
  Relieved: [
    { ref: 'Psalm 34:4', text: 'I sought the LORD, and he answered me, and delivered me from all my fears.' },
    { ref: 'Matthew 11:28', text: 'Come to me, all you who labor and are heavily burdened, and I will give you rest.' },
  ],
  Understood: [
    { ref: 'Psalm 139:1-2', text: 'The LORD, you have searched me, and you know me. You perceive my thoughts from afar.' },
    { ref: 'Hebrews 4:15', text: "For we don't have a high priest who can't be touched with the feeling of our infirmities, but one who has been in all points tempted like we are, yet without sin." },
  ],

  // ---- Sunny (filled from WEB; verify before launch) ----------------------
  Optimistic: [
    { ref: 'Jeremiah 29:11', text: 'For I know the thoughts that I think toward you, says the LORD, thoughts of peace, and not of evil, to give you hope and a future.' },
    { ref: 'Romans 15:13', text: 'Now may the God of hope fill you with all joy and peace in believing, that you may abound in hope.' },
  ],
  Alive: [
    { ref: 'John 10:10', text: 'I came that they may have life, and may have it abundantly.' },
    { ref: 'Galatians 2:20', text: 'It is no longer I who live, but Christ lives in me. That life which I now live in the flesh, I live by faith in the Son of God, who loved me and gave himself up for me.' },
  ],
  Surprised: [
    { ref: 'Ephesians 3:20', text: 'Now to him who is able to do exceedingly abundantly above all that we ask or think, according to the power that works in us,' },
    { ref: 'Psalm 126:3', text: 'The LORD has done great things for us, and we are glad.' },
  ],
  Accomplished: [
    { ref: 'Philippians 4:13', text: 'I can do all things through Christ, who strengthens me.' },
    { ref: 'Colossians 3:23', text: 'Whatever you do, work heartily, as for the Lord, and not for men.' },
  ],
  Proud: [
    { ref: 'Galatians 6:4', text: 'But let each man examine his own work, and then he will have reason for boasting in himself alone, and not in someone else.' },
    { ref: 'Jeremiah 9:23-24', text: 'Let him who boasts boast in this, that he has understanding, and knows me, that I am the LORD who exercises loving kindness, justice, and righteousness in the earth.' },
  ],
  Curious: [
    { ref: 'Proverbs 2:3-5', text: 'Yes, if you call out for discernment, and lift up your voice for understanding; if you seek her as silver, then you will understand the fear of the LORD, and find the knowledge of God.' },
    { ref: 'Jeremiah 33:3', text: "Call to me, and I will answer you, and will show you great and difficult things, which you don't know." },
  ],
  Hopeful: [
    { ref: 'Romans 15:13', text: 'Now may the God of hope fill you with all joy and peace in believing, that you may abound in hope in the power of the Holy Spirit.' },
    { ref: 'Hebrews 11:1', text: 'Now faith is assurance of things hoped for, proof of things not seen.' },
  ],
  Motivated: [
    { ref: 'Philippians 3:14', text: 'I press on toward the goal for the prize of the high calling of God in Christ Jesus.' },
    { ref: 'Colossians 3:23', text: 'Whatever you do, work heartily, as for the Lord, and not for men.' },
  ],
  Confident: [
    { ref: 'Philippians 1:6', text: 'being confident of this very thing, that he who began a good work in you will complete it until the day of Jesus Christ.' },
    { ref: 'Proverbs 3:26', text: 'for the LORD will be your confidence, and will keep your foot from being taken.' },
  ],
  Inspired: [
    { ref: '2 Timothy 1:6', text: 'stir up the gift of God which is in you.' },
    { ref: 'Psalm 40:3', text: 'He has put a new song in my mouth, even praise to our God.' },
  ],
  Eager: [
    { ref: 'Romans 12:11', text: 'not lagging in diligence; fervent in spirit; serving the Lord;' },
    { ref: 'Psalm 27:4', text: 'One thing I have asked of the LORD, that I will seek after: that I may dwell in the house of the LORD all the days of my life.' },
  ],
  Focused: [
    { ref: 'Hebrews 12:1-2', text: 'let us run with perseverance the race that is set before us, looking to Jesus, the author and perfecter of faith.' },
    { ref: 'Philippians 4:8', text: 'Whatever things are true, whatever things are honorable, whatever things are just, whatever things are pure, whatever things are lovely, think about these things.' },
  ],
  Excited: [
    { ref: 'Psalm 118:24', text: 'This is the day that the LORD has made. We will rejoice and be glad in it.' },
    { ref: 'Nehemiah 8:10', text: "Don't be grieved, for the joy of the LORD is your strength." },
  ],
  Thrilled: [
    { ref: 'Psalm 16:11', text: 'You will show me the path of life. In your presence is fullness of joy. In your right hand there are pleasures forever more.' },
    { ref: 'Zephaniah 3:17', text: 'The LORD your God is among you, a mighty one who will save. He will rejoice over you with singing.' },
  ],
  Joyful: [
    { ref: 'Philippians 4:4', text: "Rejoice in the Lord always! Again I will say, 'Rejoice!'" },
    { ref: 'Psalm 16:11', text: 'In your presence is fullness of joy. In your right hand there are pleasures forever more.' },
  ],
  Determined: [
    { ref: 'Philippians 3:14', text: 'I press on toward the goal for the prize of the high calling of God in Christ Jesus.' },
    { ref: 'Isaiah 50:7', text: "For the Lord GOD will help me. Therefore I have set my face like a flint, and I know that I won't be disappointed." },
  ],
};

// Per-category flat pools (built from CATEGORY_EMOTIONS + VERSES).
const CATEGORY_POOLS: Record<string, Verse[]> = {};
for (const [cat, emotions] of Object.entries(CATEGORY_EMOTIONS)) {
  CATEGORY_POOLS[cat] = emotions.flatMap((e) => VERSES[e] || []);
}

// ===========================================================================
// Constrained selection (pick + reflection): the AI chooses a reference from a
// category's pool; the app validates it and renders its own exact text.
// ===========================================================================

function usedKey(category: string): string {
  return `knockknock.verses.used.${category}.v2`;
}
function normalizeRef(s: string): string {
  return s
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** True if the major category has a curated pool. */
export function hasVersePoolForCategory(category: string): boolean {
  return (CATEGORY_POOLS[category]?.length ?? 0) > 0;
}

/** Verses in the category's pool not yet in the used-set (resets when empty). */
export async function getUnusedCandidates(category: string): Promise<Verse[]> {
  const pool = CATEGORY_POOLS[category];
  if (!pool || pool.length === 0) return [];
  let used: string[] = [];
  try {
    const raw = await AsyncStorage.getItem(usedKey(category));
    if (raw) used = JSON.parse(raw) as string[];
  } catch {
    used = [];
  }
  const usedSet = new Set(used.map(normalizeRef));
  const candidates = pool.filter((v) => !usedSet.has(normalizeRef(v.ref)));
  if (candidates.length === 0) {
    try {
      await AsyncStorage.removeItem(usedKey(category));
    } catch {
      // best-effort
    }
    return pool.slice();
  }
  return candidates;
}

/** Look up the exact verse for a reference (validates the AI's choice). */
export function findVerse(category: string, ref: string): Verse | null {
  const pool = CATEGORY_POOLS[category];
  if (!pool) return null;
  const target = normalizeRef(ref);
  return pool.find((v) => normalizeRef(v.ref) === target) ?? null;
}

/** App-side fallback pick when the AI's choice is invalid or the call fails. */
export function pickFallback(candidates: Verse[]): Verse | null {
  return candidates.length ? candidates[0] : null;
}

/** Record a reference as shown (global used-set per category). */
export async function commitUsed(category: string, ref: string): Promise<void> {
  let used: string[] = [];
  try {
    const raw = await AsyncStorage.getItem(usedKey(category));
    if (raw) used = JSON.parse(raw) as string[];
  } catch {
    used = [];
  }
  if (!used.some((r) => normalizeRef(r) === normalizeRef(ref))) used.push(ref);
  try {
    await AsyncStorage.setItem(usedKey(category), JSON.stringify(used));
  } catch {
    // best-effort
  }
}
