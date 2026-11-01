export interface KJVerseRecord {
  id: string; // e.g., "Romans 8:28"
  book: string;
  chapter: number;
  verse: number;
  text: string;
}

export interface TSKReference {
  ref: string;
  text: string;
  theme: string;
}

export const KJV_BOOKS_METADATA: { book: string; testament: "OT" | "NT"; chapters: number[] }[] = [
  { book: "Genesis", testament: "OT", chapters: [1] },
  { book: "Psalms", testament: "OT", chapters: [1, 19, 23, 51, 119] },
  { book: "Isaiah", testament: "OT", chapters: [53, 55] },
  { book: "Matthew", testament: "NT", chapters: [5, 6, 28] },
  { book: "John", testament: "NT", chapters: [1, 3, 14, 15] },
  { book: "Romans", testament: "NT", chapters: [3, 5, 8, 12] },
  { book: "1 Corinthians", testament: "NT", chapters: [13, 15] },
  { book: "2 Corinthians", testament: "NT", chapters: [4, 5] },
  { book: "Ephesians", testament: "NT", chapters: [1, 2, 6] },
  { book: "Philippians", testament: "NT", chapters: [2, 4] },
  { book: "Colossians", testament: "NT", chapters: [1, 3] },
  { book: "2 Timothy", testament: "NT", chapters: [3, 4] },
  { book: "Hebrews", testament: "NT", chapters: [1, 4, 11, 12] },
  { book: "James", testament: "NT", chapters: [1] },
  { book: "1 Peter", testament: "NT", chapters: [1, 2] },
  { book: "1 John", testament: "NT", chapters: [1, 4] },
  { book: "Revelation", testament: "NT", chapters: [1, 21, 22] },
];

export const INITIAL_KJV_VERSES: KJVerseRecord[] = [
  // Genesis 1
  { id: "Genesis 1:1", book: "Genesis", chapter: 1, verse: 1, text: "In the beginning God created the heaven and the earth." },
  { id: "Genesis 1:2", book: "Genesis", chapter: 1, verse: 2, text: "And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters." },
  { id: "Genesis 1:3", book: "Genesis", chapter: 1, verse: 3, text: "And God said, Let there be light: and there was light." },
  { id: "Genesis 1:4", book: "Genesis", chapter: 1, verse: 4, text: "And God saw the light, that it was good: and God divided the light from the darkness." },
  { id: "Genesis 1:5", book: "Genesis", chapter: 1, verse: 5, text: "And God called the light Day, and the darkness he called Night. And the evening and the morning were the first day." },
  { id: "Genesis 1:26", book: "Genesis", chapter: 1, verse: 26, text: "And God said, Let us make man in our image, after our likeness: and let them have dominion over the fish of the sea, and over the fowl of the air, and over the cattle, and over all the earth, and over every creeping thing that creepeth upon the earth." },
  { id: "Genesis 1:27", book: "Genesis", chapter: 1, verse: 27, text: "So God created man in his own image, in the image of God created he him; male and female created he them." },
  { id: "Genesis 1:28", book: "Genesis", chapter: 1, verse: 28, text: "And God blessed them, and God said unto them, Be fruitful, and multiply, and replenish the earth, and subdue it: and have dominion over the fish of the sea, and over the fowl of the air, and over every living thing that moveth upon the earth." },
  { id: "Genesis 1:31", book: "Genesis", chapter: 1, verse: 31, text: "And God saw every thing that he had made, and, behold, it was very good. And the evening and the morning were the sixth day." },

  // Psalms 1
  { id: "Psalms 1:1", book: "Psalms", chapter: 1, verse: 1, text: "Blessed is the man that walketh not in the counsel of the ungodly, nor standeth in the way of sinners, nor sitteth in the seat of the scornful." },
  { id: "Psalms 1:2", book: "Psalms", chapter: 1, verse: 2, text: "But his delight is in the law of the LORD; and in his law doth he meditate day and night." },
  { id: "Psalms 1:3", book: "Psalms", chapter: 1, verse: 3, text: "And he shall be like a tree planted by the rivers of water, that bringeth forth his fruit in his season; his leaf also shall not wither; and whatsoever he doeth shall prosper." },
  { id: "Psalms 1:4", book: "Psalms", chapter: 1, verse: 4, text: "The ungodly are not so: but are like the chaff which the wind driveth away." },
  { id: "Psalms 1:5", book: "Psalms", chapter: 1, verse: 5, text: "Therefore the ungodly shall not stand in the judgment, nor sinners in the congregation of the righteous." },
  { id: "Psalms 1:6", book: "Psalms", chapter: 1, verse: 6, text: "For the LORD knoweth the way of the righteous: but the way of the ungodly shall perish." },

  // Psalms 19
  { id: "Psalms 19:1", book: "Psalms", chapter: 19, verse: 1, text: "The heavens declare the glory of God; and the firmament sheweth his handywork." },
  { id: "Psalms 19:7", book: "Psalms", chapter: 19, verse: 7, text: "The law of the LORD is perfect, converting the soul: the testimony of the LORD is sure, making wise the simple." },
  { id: "Psalms 19:8", book: "Psalms", chapter: 19, verse: 8, text: "The statutes of the LORD are right, rejoicing the heart: the commandment of the LORD is pure, enlightening the eyes." },
  { id: "Psalms 19:9", book: "Psalms", chapter: 19, verse: 9, text: "The fear of the LORD is clean, enduring for ever: the judgments of the LORD are true and righteous altogether." },
  { id: "Psalms 19:10", book: "Psalms", chapter: 19, verse: 10, text: "More to be desired are they than gold, yea, than much fine gold: sweeter also than honey and the honeycomb." },
  { id: "Psalms 19:14", book: "Psalms", chapter: 19, verse: 14, text: "Let the words of my mouth, and the meditation of my heart, be acceptable in thy sight, O LORD, my strength, and my redeemer." },

  // Psalms 23
  { id: "Psalms 23:1", book: "Psalms", chapter: 23, verse: 1, text: "The LORD is my shepherd; I shall not want." },
  { id: "Psalms 23:2", book: "Psalms", chapter: 23, verse: 2, text: "He maketh me to lie down in green pastures: he leadeth me beside the still waters." },
  { id: "Psalms 23:3", book: "Psalms", chapter: 23, verse: 3, text: "He restoreth my soul: he leadeth me in the paths of righteousness for his name's sake." },
  { id: "Psalms 23:4", book: "Psalms", chapter: 23, verse: 4, text: "Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me." },
  { id: "Psalms 23:5", book: "Psalms", chapter: 23, verse: 5, text: "Thou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over." },
  { id: "Psalms 23:6", book: "Psalms", chapter: 23, verse: 6, text: "Surely goodness and mercy shall follow me all the days of my life: and I will dwell in the house of the LORD for ever." },

  // Psalms 51
  { id: "Psalms 51:1", book: "Psalms", chapter: 51, verse: 1, text: "Have mercy upon me, O God, according to thy lovingkindness: according unto the multitude of thy tender mercies blot out my transgressions." },
  { id: "Psalms 51:2", book: "Psalms", chapter: 51, verse: 2, text: "Wash me throughly from mine iniquity, and cleanse me from my sin." },
  { id: "Psalms 51:3", book: "Psalms", chapter: 51, verse: 3, text: "For I acknowledge my transgressions: and my sin is ever before me." },
  { id: "Psalms 51:10", book: "Psalms", chapter: 51, verse: 10, text: "Create in me a clean heart, O God; and renew a right spirit within me." },
  { id: "Psalms 51:12", book: "Psalms", chapter: 51, verse: 12, text: "Restore unto me the joy of thy salvation; and uphold me with thy free spirit." },
  { id: "Psalms 51:17", book: "Psalms", chapter: 51, verse: 17, text: "The sacrifices of God are a broken spirit: a broken and a contrite heart, O God, thou wilt not despise." },

  // Psalms 119
  { id: "Psalms 119:9", book: "Psalms", chapter: 119, verse: 9, text: "Wherewithal shall a young man cleanse his way? by taking heed thereto according to thy word." },
  { id: "Psalms 119:11", book: "Psalms", chapter: 119, verse: 11, text: "Thy word have I hid in mine heart, that I might not sin against thee." },
  { id: "Psalms 119:18", book: "Psalms", chapter: 119, verse: 18, text: "Open thou mine eyes, that I may behold wondrous things out of thy law." },
  { id: "Psalms 119:89", book: "Psalms", chapter: 119, verse: 89, text: "For ever, O LORD, thy word is settled in heaven." },
  { id: "Psalms 119:105", book: "Psalms", chapter: 119, verse: 105, text: "Thy word is a lamp unto my feet, and a light unto my path." },
  { id: "Psalms 119:130", book: "Psalms", chapter: 119, verse: 130, text: "The entrance of thy words giveth light; it giveth understanding unto the simple." },

  // Isaiah 53
  { id: "Isaiah 53:1", book: "Isaiah", chapter: 53, verse: 1, text: "Who hath believed our report? and to whom is the arm of the LORD revealed?" },
  { id: "Isaiah 53:3", book: "Isaiah", chapter: 53, verse: 3, text: "He is despised and rejected of men; a man of sorrows, and acquainted with grief: and we hid as it were our faces from him; he was despised, and we esteemed him not." },
  { id: "Isaiah 53:4", book: "Isaiah", chapter: 53, verse: 4, text: "Surely he hath borne our griefs, and carried our sorrows: yet we did esteem him stricken, smitten of God, and afflicted." },
  { id: "Isaiah 53:5", book: "Isaiah", chapter: 53, verse: 5, text: "But he was wounded for our transgressions, he was bruised for our iniquities: the chastisement of our peace was upon him; and with his stripes we are healed." },
  { id: "Isaiah 53:6", book: "Isaiah", chapter: 53, verse: 6, text: "All we like sheep have gone astray; we have turned every one to his own way; and the LORD hath laid on him the iniquity of us all." },
  { id: "Isaiah 53:10", book: "Isaiah", chapter: 53, verse: 10, text: "Yet it pleased the LORD to bruise him; he hath put him to grief: when thou shalt make his soul an offering for sin, he shall see his seed, he shall prolong his days, and the pleasure of the LORD shall prosper in his hand." },
  { id: "Isaiah 53:11", book: "Isaiah", chapter: 53, verse: 11, text: "He shall see of the travail of his soul, and shall be satisfied: by his knowledge shall my righteous servant justify many; for he shall bear their iniquities." },

  // Isaiah 55
  { id: "Isaiah 55:1", book: "Isaiah", chapter: 55, verse: 1, text: "Ho, every one that thirsteth, come ye to the waters, and he that hath no money; come ye, buy, and eat; yea, come, buy wine and milk without money and without price." },
  { id: "Isaiah 55:6", book: "Isaiah", chapter: 55, verse: 6, text: "Seek ye the LORD while he may be found, call ye upon him while he is near:" },
  { id: "Isaiah 55:7", book: "Isaiah", chapter: 55, verse: 7, text: "Let the wicked forsake his way, and the unrighteous man his thoughts: and let him return unto the LORD, and he will have mercy upon him; and to our God, for he will abundantly pardon." },
  { id: "Isaiah 55:8", book: "Isaiah", chapter: 55, verse: 8, text: "For my thoughts are not your thoughts, neither are your ways my ways, saith the LORD." },
  { id: "Isaiah 55:11", book: "Isaiah", chapter: 55, verse: 11, text: "So shall my word be that goeth forth out of my mouth: it shall not return unto me void, but it shall accomplish that which I please, and it shall prosper in the thing whereto I sent it." },

  // Matthew 5
  { id: "Matthew 5:3", book: "Matthew", chapter: 5, verse: 3, text: "Blessed are the poor in spirit: for theirs is the kingdom of heaven." },
  { id: "Matthew 5:4", book: "Matthew", chapter: 5, verse: 4, text: "Blessed are they that mourn: for they shall be comforted." },
  { id: "Matthew 5:6", book: "Matthew", chapter: 5, verse: 6, text: "Blessed are they which do hunger and thirst after righteousness: for they shall be filled." },
  { id: "Matthew 5:8", book: "Matthew", chapter: 5, verse: 8, text: "Blessed are the pure in heart: for they shall see God." },
  { id: "Matthew 5:14", book: "Matthew", chapter: 5, verse: 14, text: "Ye are the light of the world. A city that is set on an hill cannot be hid." },
  { id: "Matthew 5:16", book: "Matthew", chapter: 5, verse: 16, text: "Let your light so shine before men, that they may see your good works, and glorify your Father which is in heaven." },

  // Matthew 6
  { id: "Matthew 6:9", book: "Matthew", chapter: 6, verse: 9, text: "After this manner therefore pray ye: Our Father which art in heaven, Hallowed be thy name." },
  { id: "Matthew 6:10", book: "Matthew", chapter: 6, verse: 10, text: "Thy kingdom come. Thy will be done in earth, as it is in heaven." },
  { id: "Matthew 6:33", book: "Matthew", chapter: 6, verse: 33, text: "But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you." },
  { id: "Matthew 6:34", book: "Matthew", chapter: 6, verse: 34, text: "Take therefore no thought for the morrow: for the morrow shall take thought for the things of itself. Sufficient unto the day is the evil thereof." },

  // Matthew 28
  { id: "Matthew 28:18", book: "Matthew", chapter: 28, verse: 18, text: "And Jesus came and spake unto them, saying, All power is given unto me in heaven and in earth." },
  { id: "Matthew 28:19", book: "Matthew", chapter: 28, verse: 19, text: "Go ye therefore, and teach all nations, baptizing them in the name of the Father, and of the Son, and of the Holy Ghost:" },
  { id: "Matthew 28:20", book: "Matthew", chapter: 28, verse: 20, text: "Teaching them to observe all things whatsoever I have commanded you: and, lo, I am with you alway, even unto the end of the world. Amen." },

  // John 1
  { id: "John 1:1", book: "John", chapter: 1, verse: 1, text: "In the beginning was the Word, and the Word was with God, and the Word was God." },
  { id: "John 1:2", book: "John", chapter: 1, verse: 2, text: "The same was in the beginning with God." },
  { id: "John 1:3", book: "John", chapter: 1, verse: 3, text: "All things were made by him; and without him was not any thing made that was made." },
  { id: "John 1:4", book: "John", chapter: 1, verse: 4, text: "In him was life; and the life was the light of men." },
  { id: "John 1:5", book: "John", chapter: 1, verse: 5, text: "And the light shineth in darkness; and the darkness comprehended it not." },
  { id: "John 1:12", book: "John", chapter: 1, verse: 12, text: "But as many as received him, to them gave he power to become the sons of God, even to them that believe on his name:" },
  { id: "John 1:14", book: "John", chapter: 1, verse: 14, text: "And the Word was made flesh, and dwelt among us, (and we beheld his glory, the glory as of the only begotten of the Father,) full of grace and truth." },
  { id: "John 1:16", book: "John", chapter: 1, verse: 16, text: "And of his fulness have all we received, and grace for grace." },
  { id: "John 1:17", book: "John", chapter: 1, verse: 17, text: "For the law was given by Moses, but grace and truth came by Jesus Christ." },
  { id: "John 1:29", book: "John", chapter: 1, verse: 29, text: "The next day John seeth Jesus coming unto him, and saith, Behold the Lamb of God, which taketh away the sin of the world." },

  // John 3
  { id: "John 3:3", book: "John", chapter: 3, verse: 3, text: "Jesus answered and said unto him, Verily, verily, I say unto thee, Except a man be born again, he cannot see the kingdom of God." },
  { id: "John 3:5", book: "John", chapter: 3, verse: 5, text: "Jesus answered, Verily, verily, I say unto thee, Except a man be born of water and of the Spirit, he cannot enter into the kingdom of God." },
  { id: "John 3:14", book: "John", chapter: 3, verse: 14, text: "And as Moses lifted up the serpent in the wilderness, even so must the Son of man be lifted up:" },
  { id: "John 3:15", book: "John", chapter: 3, verse: 15, text: "That whosoever believeth in him should not perish, but have eternal life." },
  { id: "John 3:16", book: "John", chapter: 3, verse: 16, text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life." },
  { id: "John 3:17", book: "John", chapter: 3, verse: 17, text: "For God sent not his Son into the world to condemn the world; but that the world through him might be saved." },
  { id: "John 3:18", book: "John", chapter: 3, verse: 18, text: "He that believeth on him is not condemned: but he that believeth not is condemned already, because he hath not believed in the name of the only begotten Son of God." },
  { id: "John 3:30", book: "John", chapter: 3, verse: 30, text: "He must increase, but I must decrease." },
  { id: "John 3:36", book: "John", chapter: 3, verse: 36, text: "He that believeth on the Son hath everlasting life: and he that believeth not the Son shall not see life; but the wrath of God abideth on him." },

  // John 14
  { id: "John 14:1", book: "John", chapter: 14, verse: 1, text: "Let not your heart be troubled: ye believe in God, believe also in me." },
  { id: "John 14:2", book: "John", chapter: 14, verse: 2, text: "In my Father's house are many mansions: if it were not so, I would have told you. I go to prepare a place for you." },
  { id: "John 14:6", book: "John", chapter: 14, verse: 6, text: "Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me." },
  { id: "John 14:15", book: "John", chapter: 14, verse: 15, text: "If ye love me, keep my commandments." },
  { id: "John 14:26", book: "John", chapter: 14, verse: 26, text: "But the Comforter, which is the Holy Ghost, whom the Father will send in my name, he shall teach you all things, and bring all things to your remembrance, whatsoever I have said unto you." },
  { id: "John 14:27", book: "John", chapter: 14, verse: 27, text: "Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid." },

  // John 15
  { id: "John 15:1", book: "John", chapter: 15, verse: 1, text: "I am the true vine, and my Father is the husbandman." },
  { id: "John 15:4", book: "John", chapter: 15, verse: 4, text: "Abide in me, and I in you. As the branch cannot bear fruit of itself, except it abide in the vine; no more can ye, except ye abide in me." },
  { id: "John 15:5", book: "John", chapter: 15, verse: 5, text: "I am the vine, ye are the branches: He that abideth in me, and I in him, the same bringeth forth much fruit: for without me ye can do nothing." },
  { id: "John 15:13", book: "John", chapter: 15, verse: 13, text: "Greater love hath no man than this, that a man lay down his life for his friends." },

  // Romans 3
  { id: "Romans 3:10", book: "Romans", chapter: 3, verse: 10, text: "As it is written, There is none righteous, no, not one:" },
  { id: "Romans 3:19", book: "Romans", chapter: 3, verse: 19, text: "Now we know that what things soever the law saith, it saith to them who are under the law: that every mouth may be stopped, and all the world may become guilty before God." },
  { id: "Romans 3:20", book: "Romans", chapter: 3, verse: 20, text: "Therefore by the deeds of the law there shall no flesh be justified in his sight: for by the law is the knowledge of sin." },
  { id: "Romans 3:23", book: "Romans", chapter: 3, verse: 23, text: "For all have sinned, and come short of the glory of God;" },
  { id: "Romans 3:24", book: "Romans", chapter: 3, verse: 24, text: "Being justified freely by his grace through the redemption that is in Christ Jesus:" },
  { id: "Romans 3:25", book: "Romans", chapter: 3, verse: 25, text: "Whom God hath set forth to be a propitiation through faith in his blood, to declare his righteousness for the remission of sins that are past, through the forbearance of God;" },
  { id: "Romans 3:26", book: "Romans", chapter: 3, verse: 26, text: "To declare, I say, at this time his righteousness: that he might be just, and the justifier of him which believeth in Jesus." },
  { id: "Romans 3:28", book: "Romans", chapter: 3, verse: 28, text: "Therefore we conclude that a man is justified by faith without the deeds of the law." },

  // Romans 5
  { id: "Romans 5:1", book: "Romans", chapter: 5, verse: 1, text: "Therefore being justified by faith, we have peace with God through our Lord Jesus Christ:" },
  { id: "Romans 5:2", book: "Romans", chapter: 5, verse: 2, text: "By whom also we have access by faith into this grace wherein we stand, and rejoice in hope of the glory of God." },
  { id: "Romans 5:3", book: "Romans", chapter: 5, verse: 3, text: "And not only so, but we glory in tribulations also: knowing that tribulation worketh patience;" },
  { id: "Romans 5:4", book: "Romans", chapter: 5, verse: 4, text: "And patience, experience; and experience, hope:" },
  { id: "Romans 5:5", book: "Romans", chapter: 5, verse: 5, text: "And hope maketh not ashamed; because the love of God is shed abroad in our hearts by the Holy Ghost which is given unto us." },
  { id: "Romans 5:6", book: "Romans", chapter: 5, verse: 6, text: "For when we were yet without strength, in due time Christ died for the ungodly." },
  { id: "Romans 5:8", book: "Romans", chapter: 5, verse: 8, text: "But God commendeth his love toward us, in that, while we were yet sinners, Christ died for us." },
  { id: "Romans 5:9", book: "Romans", chapter: 5, verse: 9, text: "Much more then, being now justified by his blood, we shall be saved from wrath through him." },
  { id: "Romans 5:19", book: "Romans", chapter: 5, verse: 19, text: "For as by one man's disobedience many were made sinners, so by the obedience of one shall many be made righteous." },
  { id: "Romans 5:20", book: "Romans", chapter: 5, verse: 20, text: "Moreover the law entered, that the offence might abound. But where sin abounded, grace did much more abound:" },
  { id: "Romans 5:21", book: "Romans", chapter: 5, verse: 21, text: "That as sin hath reigned unto death, even so might grace reign through righteousness unto eternal life by Jesus Christ our Lord." },

  // Romans 8 (Full rich study chapter)
  { id: "Romans 8:1", book: "Romans", chapter: 8, verse: 1, text: "There is therefore now no condemnation to them which are in Christ Jesus, who walk not after the flesh, but after the Spirit." },
  { id: "Romans 8:2", book: "Romans", chapter: 8, verse: 2, text: "For the law of the Spirit of life in Christ Jesus hath made me free from the law of sin and death." },
  { id: "Romans 8:3", book: "Romans", chapter: 8, verse: 3, text: "For what the law could not do, in that it was weak through the flesh, God sending his own Son in the likeness of sinful flesh, and for sin, condemned sin in the flesh:" },
  { id: "Romans 8:4", book: "Romans", chapter: 8, verse: 4, text: "That the righteousness of the law might be fulfilled in us, who walk not after the flesh, but after the Spirit." },
  { id: "Romans 8:5", book: "Romans", chapter: 8, verse: 5, text: "For they that are after the flesh do mind the things of the flesh; but they that are after the Spirit the things of the Spirit." },
  { id: "Romans 8:6", book: "Romans", chapter: 8, verse: 6, text: "For to be carnally minded is death; but to be spiritually minded is life and peace." },
  { id: "Romans 8:11", book: "Romans", chapter: 8, verse: 11, text: "But if the Spirit of him that raised up Jesus from the dead dwell in you, he that raised up Christ from the dead shall also quicken your mortal bodies by his Spirit that dwelleth in you." },
  { id: "Romans 8:14", book: "Romans", chapter: 8, verse: 14, text: "For as many as are led by the Spirit of God, they are the sons of God." },
  { id: "Romans 8:15", book: "Romans", chapter: 8, verse: 15, text: "For ye have not received the spirit of bondage again to fear; but ye have received the Spirit of adoption, whereby we cry, Abba, Father." },
  { id: "Romans 8:16", book: "Romans", chapter: 8, verse: 16, text: "The Spirit itself beareth witness with our spirit, that we are the children of God:" },
  { id: "Romans 8:17", book: "Romans", chapter: 8, verse: 17, text: "And if children, then heirs; heirs of God, and joint-heirs with Christ; if so be that we suffer with him, that we may be also glorified together." },
  { id: "Romans 8:18", book: "Romans", chapter: 8, verse: 18, text: "For I reckon that the sufferings of this present time are not worthy to be compared with the glory which shall be revealed in us." },
  { id: "Romans 8:26", book: "Romans", chapter: 8, verse: 26, text: "Likewise the Spirit also helpeth our infirmities: for we know not what we should pray for as we ought: but the Spirit itself maketh intercession for us with groanings which cannot be uttered." },
  { id: "Romans 8:27", book: "Romans", chapter: 8, verse: 27, text: "And he that searcheth the hearts knoweth what is the mind of the Spirit, because he maketh intercession for the saints according to the will of God." },
  { id: "Romans 8:28", book: "Romans", chapter: 8, verse: 28, text: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose." },
  { id: "Romans 8:29", book: "Romans", chapter: 8, verse: 29, text: "For whom he did foreknow, he also did predestinate to be conformed to the image of his Son, that he might be the firstborn among many brethren." },
  { id: "Romans 8:30", book: "Romans", chapter: 8, verse: 30, text: "Moreover whom he did predestinate, them he also called: and whom he called, them he also justified: and whom he justified, them he also glorified." },
  { id: "Romans 8:31", book: "Romans", chapter: 8, verse: 31, text: "What shall we then say to these things? If God be for us, who can be against us?" },
  { id: "Romans 8:32", book: "Romans", chapter: 8, verse: 32, text: "He that spared not his own Son, but delivered him up for us all, how shall he not with him also freely give us all things?" },
  { id: "Romans 8:33", book: "Romans", chapter: 8, verse: 33, text: "Who shall lay any thing to the charge of God's elect? It is God that justifieth." },
  { id: "Romans 8:34", book: "Romans", chapter: 8, verse: 34, text: "Who is he that condemneth? It is Christ that died, yea rather, that is risen again, who is even at the right hand of God, who also maketh intercession for us." },
  { id: "Romans 8:35", book: "Romans", chapter: 8, verse: 35, text: "Who shall separate us from the love of Christ? shall tribulation, or distress, or persecution, or famine, or nakedness, or peril, or sword?" },
  { id: "Romans 8:37", book: "Romans", chapter: 8, verse: 37, text: "Nay, in all these things we are more than conquerors through him that loved us." },
  { id: "Romans 8:38", book: "Romans", chapter: 8, verse: 38, text: "For I am persuaded, that neither death, nor life, nor angels, nor principalities, nor powers, nor things present, nor things to come," },
  { id: "Romans 8:39", book: "Romans", chapter: 8, verse: 39, text: "Nor height, nor depth, nor any other creature, shall be able to separate us from the love of God, which is in Christ Jesus our Lord." },

  // Romans 12
  { id: "Romans 12:1", book: "Romans", chapter: 12, verse: 1, text: "I beseech you therefore, brethren, by the mercies of God, that ye present your bodies a living sacrifice, holy, acceptable unto God, which is your reasonable service." },
  { id: "Romans 12:2", book: "Romans", chapter: 12, verse: 2, text: "And be not conformed to this world: but be ye transformed by the renewing of your mind, that ye may prove what is that good, and acceptable, and perfect, will of God." },
  { id: "Romans 12:9", book: "Romans", chapter: 12, verse: 9, text: "Let love be without dissimulation. Abhor that which is evil; cleave to that which is good." },
  { id: "Romans 12:12", book: "Romans", chapter: 12, verse: 12, text: "Rejoicing in hope; patient in tribulation; continuing instant in prayer;" },
  { id: "Romans 12:21", book: "Romans", chapter: 12, verse: 21, text: "Be not overcome of evil, but overcome evil with good." },

  // 1 Corinthians 13
  { id: "1 Corinthians 13:1", book: "1 Corinthians", chapter: 13, verse: 1, text: "Though I speak with the tongues of men and of angels, and have not charity, I am become as sounding brass, or a tinkling cymbal." },
  { id: "1 Corinthians 13:4", book: "1 Corinthians", chapter: 13, verse: 4, text: "Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up," },
  { id: "1 Corinthians 13:7", book: "1 Corinthians", chapter: 13, verse: 7, text: "Beareth all things, believeth all things, hopeth all things, endureth all things." },
  { id: "1 Corinthians 13:8", book: "1 Corinthians", chapter: 13, verse: 8, text: "Charity never faileth: but whether there be prophecies, they shall fail; whether there be tongues, they shall cease; whether there be knowledge, it shall vanish away." },
  { id: "1 Corinthians 13:13", book: "1 Corinthians", chapter: 13, verse: 13, text: "And now abideth faith, hope, charity, these three; but the greatest of these is charity." },

  // 1 Corinthians 15
  { id: "1 Corinthians 15:1", book: "1 Corinthians", chapter: 15, verse: 1, text: "Moreover, brethren, I declare unto you the gospel which I preached unto you, which also ye have received, and wherein ye stand;" },
  { id: "1 Corinthians 15:3", book: "1 Corinthians", chapter: 15, verse: 3, text: "For I delivered unto you first of all that which I also received, how that Christ died for our sins according to the scriptures;" },
  { id: "1 Corinthians 15:4", book: "1 Corinthians", chapter: 15, verse: 4, text: "And that he was buried, and that he rose again the third day according to the scriptures:" },
  { id: "1 Corinthians 15:10", book: "1 Corinthians", chapter: 15, verse: 10, text: "But by the grace of God I am what I am: and his grace which was bestowed upon me was not in vain; but I laboured more abundantly than they all: yet not I, but the grace of God which was with me." },
  { id: "1 Corinthians 15:55", book: "1 Corinthians", chapter: 15, verse: 55, text: "O death, where is thy sting? O grave, where is thy victory?" },
  { id: "1 Corinthians 15:57", book: "1 Corinthians", chapter: 15, verse: 57, text: "But thanks be to God, which giveth us the victory through our Lord Jesus Christ." },
  { id: "1 Corinthians 15:58", book: "1 Corinthians", chapter: 15, verse: 58, text: "Therefore, my beloved brethren, be ye stedfast, unmoveable, always abounding in the work of the Lord, forasmuch as ye know that your labour is not in vain in the Lord." },

  // 2 Corinthians 4 & 5
  { id: "2 Corinthians 4:5", book: "2 Corinthians", chapter: 4, verse: 5, text: "For we preach not ourselves, but Christ Jesus the Lord; and ourselves your servants for Jesus' sake." },
  { id: "2 Corinthians 4:6", book: "2 Corinthians", chapter: 4, verse: 6, text: "For God, who commanded the light to shine out of darkness, hath shined in our hearts, to give the light of the knowledge of the glory of God in the face of Jesus Christ." },
  { id: "2 Corinthians 4:7", book: "2 Corinthians", chapter: 4, verse: 7, text: "But we have this treasure in earthen vessels, that the excellency of the power may be of God, and not of us." },
  { id: "2 Corinthians 4:17", book: "2 Corinthians", chapter: 4, verse: 17, text: "For our light affliction, which is but for a moment, worketh for us a far more exceeding and eternal weight of glory;" },
  { id: "2 Corinthians 5:17", book: "2 Corinthians", chapter: 5, verse: 17, text: "Therefore if any man be in Christ, he is a new creature: old things are passed away; behold, all things are become new." },
  { id: "2 Corinthians 5:20", book: "2 Corinthians", chapter: 5, verse: 20, text: "Now then we are ambassadors for Christ, as though God did beseech you by us: we pray you in Christ's stead, be ye reconciled to God." },
  { id: "2 Corinthians 5:21", book: "2 Corinthians", chapter: 5, verse: 21, text: "For he hath made him to be sin for us, who knew no sin; that we might be made the righteousness of God in him." },

  // Ephesians 1, 2, 6
  { id: "Ephesians 1:3", book: "Ephesians", chapter: 1, verse: 3, text: "Blessed be the God and Father of our Lord Jesus Christ, who hath blessed us with all spiritual blessings in heavenly places in Christ:" },
  { id: "Ephesians 1:4", book: "Ephesians", chapter: 1, verse: 4, text: "According as he hath chosen us in him before the foundation of the world, that we should be holy and without blame before him in love:" },
  { id: "Ephesians 1:7", book: "Ephesians", chapter: 1, verse: 7, text: "In whom we have redemption through his blood, the forgiveness of sins, according to the riches of his grace;" },
  { id: "Ephesians 1:11", book: "Ephesians", chapter: 1, verse: 11, text: "In whom also we have obtained an inheritance, being predestinated according to the purpose of him who worketh all things after the counsel of his own will:" },
  { id: "Ephesians 2:1", book: "Ephesians", chapter: 2, verse: 1, text: "And you hath he quickened, who were dead in trespasses and sins;" },
  { id: "Ephesians 2:4", book: "Ephesians", chapter: 2, verse: 4, text: "But God, who is rich in mercy, for his great love wherewith he loved us," },
  { id: "Ephesians 2:5", book: "Ephesians", chapter: 2, verse: 5, text: "Even when we were dead in sins, hath quickened us together with Christ, (by grace ye are saved;)" },
  { id: "Ephesians 2:8", book: "Ephesians", chapter: 2, verse: 8, text: "For by grace are ye saved through faith; and that not of yourselves: it is the gift of God:" },
  { id: "Ephesians 2:9", book: "Ephesians", chapter: 2, verse: 9, text: "Not of works, lest any man should boast." },
  { id: "Ephesians 2:10", book: "Ephesians", chapter: 2, verse: 10, text: "For we are his workmanship, created in Christ Jesus unto good works, which God hath before ordained that we should walk in them." },
  { id: "Ephesians 6:10", book: "Ephesians", chapter: 6, verse: 10, text: "Finally, my brethren, be strong in the Lord, and in the power of his might." },
  { id: "Ephesians 6:11", book: "Ephesians", chapter: 6, verse: 11, text: "Put on the whole armour of God, that ye may be able to stand against the wiles of the devil." },
  { id: "Ephesians 6:17", book: "Ephesians", chapter: 6, verse: 17, text: "And take the helmet of salvation, and the sword of the Spirit, which is the word of God:" },

  // Philippians 2 & 4
  { id: "Philippians 2:5", book: "Philippians", chapter: 2, verse: 5, text: "Let this mind be in you, which was also in Christ Jesus:" },
  { id: "Philippians 2:6", book: "Philippians", chapter: 2, verse: 6, text: "Who, being in the form of God, thought it not robbery to be equal with God:" },
  { id: "Philippians 2:7", book: "Philippians", chapter: 2, verse: 7, text: "But made himself of no reputation, and took upon him the form of a servant, and was made in the likeness of men:" },
  { id: "Philippians 2:8", book: "Philippians", chapter: 2, verse: 8, text: "And being found in fashion as a man, he humbled himself, and became obedient unto death, even the death of the cross." },
  { id: "Philippians 2:9", book: "Philippians", chapter: 2, verse: 9, text: "Wherefore God also hath highly exalted him, and given him a name which is above every name:" },
  { id: "Philippians 4:6", book: "Philippians", chapter: 4, verse: 6, text: "Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God." },
  { id: "Philippians 4:7", book: "Philippians", chapter: 4, verse: 7, text: "And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus." },
  { id: "Philippians 4:8", book: "Philippians", chapter: 4, verse: 8, text: "Finally, brethren, whatsoever things are true, whatsoever things are honest, whatsoever things are just, whatsoever things are pure, whatsoever things are lovely, whatsoever things are of good report; if there be any virtue, and if there be any praise, think on these things." },
  { id: "Philippians 4:13", book: "Philippians", chapter: 4, verse: 13, text: "I can do all things through Christ which strengtheneth me." },

  // Colossians 1 & 3
  { id: "Colossians 1:15", book: "Colossians", chapter: 1, verse: 15, text: "Who is the image of the invisible God, the firstborn of every creature:" },
  { id: "Colossians 1:16", book: "Colossians", chapter: 1, verse: 16, text: "For by him were all things created, that are in heaven, and that are in earth, visible and invisible, whether they be thrones, or dominions, or principalities, or powers: all things were created by him, and for him:" },
  { id: "Colossians 1:17", book: "Colossians", chapter: 1, verse: 17, text: "And he is before all things, and by him all things consist." },
  { id: "Colossians 1:18", book: "Colossians", chapter: 1, verse: 18, text: "And he is the head of the body, the church: who is the beginning, the firstborn from the dead; that in all things he might have the preeminence." },
  { id: "Colossians 3:1", book: "Colossians", chapter: 3, verse: 1, text: "If ye then be risen with Christ, seek those things which are above, where Christ sitteth on the right hand of God." },
  { id: "Colossians 3:2", book: "Colossians", chapter: 3, verse: 2, text: "Set your affection on things above, not on things on the earth." },
  { id: "Colossians 3:16", book: "Colossians", chapter: 3, verse: 16, text: "Let the word of Christ dwell in you richly in all wisdom; teaching and admonishing one another in psalms and hymns and spiritual songs, singing with grace in your hearts to the Lord." },

  // 2 Timothy 3 & 4
  { id: "2 Timothy 3:15", book: "2 Timothy", chapter: 3, verse: 15, text: "And that from a child thou hast known the holy scriptures, which are able to make thee wise unto salvation through faith which is in Christ Jesus." },
  { id: "2 Timothy 3:16", book: "2 Timothy", chapter: 3, verse: 16, text: "All scripture is given by inspiration of God, and is profitable for doctrine, for reproof, for correction, for instruction in righteousness:" },
  { id: "2 Timothy 3:17", book: "2 Timothy", chapter: 3, verse: 17, text: "That the man of God may be perfect, throughly furnished unto all good works." },
  { id: "2 Timothy 4:1", book: "2 Timothy", chapter: 4, verse: 1, text: "I charge thee therefore before God, and the Lord Jesus Christ, who shall judge the quick and the dead at his appearing and his kingdom;" },
  { id: "2 Timothy 4:2", book: "2 Timothy", chapter: 4, verse: 2, text: "Preach the word; be instant in season, out of season; reprove, rebuke, exhort with all longsuffering and doctrine." },
  { id: "2 Timothy 4:7", book: "2 Timothy", chapter: 4, verse: 7, text: "I have fought a good fight, I have finished my course, I have kept the faith:" },
  { id: "2 Timothy 4:8", book: "2 Timothy", chapter: 4, verse: 8, text: "Henceforth there is laid up for me a crown of righteousness, which the Lord, the righteous judge, shall give me at that day: and not to me only, but unto all them also that love his appearing." },

  // Hebrews 1, 4, 11, 12
  { id: "Hebrews 1:1", book: "Hebrews", chapter: 1, verse: 1, text: "God, who at sundry times and in divers manners spake in time past unto the fathers by the prophets," },
  { id: "Hebrews 1:2", book: "Hebrews", chapter: 1, verse: 2, text: "Hath in these last days spoken unto us by his Son, whom he hath appointed heir of all things, by whom also he made the worlds;" },
  { id: "Hebrews 1:3", book: "Hebrews", chapter: 1, verse: 3, text: "Who being the brightness of his glory, and the express image of his person, and upholding all things by the word of his power, when he had by himself purged our sins, sat down on the right hand of the Majesty on high;" },
  { id: "Hebrews 4:12", book: "Hebrews", chapter: 4, verse: 12, text: "For the word of God is quick, and powerful, and sharper than any twoedged sword, piercing even to the dividing asunder of soul and spirit, and of the joints and marrow, and is a discerner of the thoughts and intents of the heart." },
  { id: "Hebrews 4:15", book: "Hebrews", chapter: 4, verse: 15, text: "For we have not an high priest which cannot be touched with the feeling of our infirmities; but was in all points tempted like as we are, yet without sin." },
  { id: "Hebrews 4:16", book: "Hebrews", chapter: 4, verse: 16, text: "Let us therefore come boldly unto the throne of grace, that we may obtain mercy, and find grace to help in time of need." },
  { id: "Hebrews 11:1", book: "Hebrews", chapter: 11, verse: 1, text: "Now faith is the substance of things hoped for, the evidence of things not seen." },
  { id: "Hebrews 11:6", book: "Hebrews", chapter: 11, verse: 6, text: "But without faith it is impossible to please him: for he that cometh to God must believe that he is, and that he is a rewarder of them that diligently seek him." },
  { id: "Hebrews 12:1", book: "Hebrews", chapter: 12, verse: 1, text: "Wherefore seeing we also are compassed about with so great a cloud of witnesses, let us lay aside every weight, and the sin which doth so easily beset us, and let us run with patience the race that is set before us," },
  { id: "Hebrews 12:2", book: "Hebrews", chapter: 12, verse: 2, text: "Looking unto Jesus the author and finisher of our faith; who for the joy that was set before him endured the cross, despising the shame, and is set down at the right hand of the throne of God." },

  // James 1
  { id: "James 1:2", book: "James", chapter: 1, verse: 2, text: "My brethren, count it all joy when ye fall into divers temptations;" },
  { id: "James 1:3", book: "James", chapter: 1, verse: 3, text: "Knowing this, that the trying of your faith worketh patience." },
  { id: "James 1:5", book: "James", chapter: 1, verse: 5, text: "If any of you lack wisdom, let him ask of God, that giveth to all men liberally, and upbraideth not; and it shall be given him." },
  { id: "James 1:17", book: "James", chapter: 1, verse: 17, text: "Every good gift and every perfect gift is from above, and cometh down from the Father of lights, with whom is no variableness, neither shadow of turning." },
  { id: "James 1:22", book: "James", chapter: 1, verse: 22, text: "But be ye doers of the word, and not hearers only, deceiving your own selves." },

  // 1 Peter 1 & 2
  { id: "1 Peter 1:3", book: "1 Peter", chapter: 1, verse: 3, text: "Blessed be the God and Father of our Lord Jesus Christ, which according to his abundant mercy hath begotten us again unto a lively hope by the resurrection of Jesus Christ from the dead," },
  { id: "1 Peter 1:18", book: "1 Peter", chapter: 1, verse: 18, text: "Forasmuch as ye know that ye were not redeemed with corruptible things, as silver and gold, from your vain conversation received by tradition from your fathers;" },
  { id: "1 Peter 1:19", book: "1 Peter", chapter: 1, verse: 19, text: "But with the precious blood of Christ, as of a lamb without blemish and without spot:" },
  { id: "1 Peter 1:23", book: "1 Peter", chapter: 1, verse: 23, text: "Being born again, not of corruptible seed, but of incorruptible, by the word of God, which liveth and abideth for ever." },
  { id: "1 Peter 2:9", book: "1 Peter", chapter: 2, verse: 9, text: "But ye are a chosen generation, a royal priesthood, an holy nation, a peculiar people; that ye should shew forth the praises of him who hath called you out of darkness into his marvellous light:" },
  { id: "1 Peter 2:24", book: "1 Peter", chapter: 2, verse: 24, text: "Who his own self bare our sins in his own body on the tree, that we, being dead to sins, should live unto righteousness: by whose stripes ye were healed." },

  // 1 John 1 & 4
  { id: "1 John 1:7", book: "1 John", chapter: 1, verse: 7, text: "But if we walk in the light, as he is in the light, we have fellowship one with another, and the blood of Jesus Christ his Son cleanseth us from all sin." },
  { id: "1 John 1:8", book: "1 John", chapter: 1, verse: 8, text: "If we say that we have no sin, we deceive ourselves, and the truth is not in us." },
  { id: "1 John 1:9", book: "1 John", chapter: 1, verse: 9, text: "If we confess our sins, he is faithful and just to forgive us our sins, and to cleanse us from all unrighteousness." },
  { id: "1 John 4:8", book: "1 John", chapter: 4, verse: 8, text: "He that loveth not knoweth not God; for God is love." },
  { id: "1 John 4:10", book: "1 John", chapter: 4, verse: 10, text: "Herein is love, not that we loved God, but that he loved us, and sent his Son to be the propitiation for our sins." },
  { id: "1 John 4:19", book: "1 John", chapter: 4, verse: 19, text: "We love him, because he first loved us." },

  // Revelation 1, 21, 22
  { id: "Revelation 1:8", book: "Revelation", chapter: 1, verse: 8, text: "I am Alpha and Omega, the beginning and the ending, saith the Lord, which is, and which was, and which is to come, the Almighty." },
  { id: "Revelation 21:4", book: "Revelation", chapter: 21, verse: 4, text: "And God shall wipe away all tears from their eyes; and there shall be no more death, neither sorrow, nor crying, neither shall there be any more pain: for the former things are passed away." },
  { id: "Revelation 21:5", book: "Revelation", chapter: 21, verse: 5, text: "And he that sat upon the throne said, Behold, I make all things new. And he said unto me, Write: for these words are true and faithful." },
  { id: "Revelation 22:17", book: "Revelation", chapter: 22, verse: 17, text: "And the Spirit and the bride say, Come. And let him that heareth say, Come. And let him that is athirst come. And whosoever will, let him take the water of life freely." },
  { id: "Revelation 22:20", book: "Revelation", chapter: 22, verse: 20, text: "He which testifieth these things saith, Surely I come quickly. Amen. Even so, come, Lord Jesus." },
];

// Curated Treasury of Scripture Knowledge (TSK) Cross-Reference Index
export const TSK_CROSS_REFERENCES: Record<string, TSKReference[]> = {
  "Romans 8:1": [
    {
      ref: "John 5:24",
      text: "Verily, verily, I say unto you, He that heareth my word, and believeth on him that sent me, hath everlasting life, and shall not come into condemnation; but is passed from death unto life.",
      theme: "Justification & No Condemnation",
    },
    {
      ref: "Romans 5:1",
      text: "Therefore being justified by faith, we have peace with God through our Lord Jesus Christ:",
      theme: "Peace with God",
    },
    {
      ref: "Galatians 5:16",
      text: "This I say then, Walk in the Spirit, and ye shall not fulfil the lust of the flesh.",
      theme: "Walking in the Spirit",
    },
  ],
  "Romans 8:18": [
    {
      ref: "2 Corinthians 4:17",
      text: "For our light affliction, which is but for a moment, worketh for us a far more exceeding and eternal weight of glory;",
      theme: "Present Suffering vs. Future Glory",
    },
    {
      ref: "1 Peter 1:6",
      text: "Wherein ye greatly rejoice, though now for a season, if need be, ye are in heaviness through manifold temptations:",
      theme: "Refining Trials",
    },
  ],
  "Romans 8:28": [
    {
      ref: "Genesis 50:20",
      text: "But as for you, ye thought evil against me; but God meant it unto good, to bring to pass, as it is this day, to save much people alive.",
      theme: "Divine Providence Over Evil",
    },
    {
      ref: "Ephesians 1:11",
      text: "In whom also we have obtained an inheritance, being predestinated according to the purpose of him who worketh all things after the counsel of his own will:",
      theme: "Sovereign Purpose",
    },
    {
      ref: "Jeremiah 29:11",
      text: "For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.",
      theme: "Covenant Faithfulness",
    },
  ],
  "Romans 8:29": [
    {
      ref: "Ephesians 1:4",
      text: "According as he hath chosen us in him before the foundation of the world, that we should be holy and without blame before him in love:",
      theme: "Foreknowledge & Election",
    },
    {
      ref: "1 John 3:2",
      text: "Beloved, now are we the sons of God, and it doth not yet appear what we shall be: but we know that, when he shall appear, we shall be like him; for we shall see him as he is.",
      theme: "Conformed to Christ's Image",
    },
    {
      ref: "Colossians 1:18",
      text: "And he is the head of the body, the church: who is the beginning, the firstborn from the dead; that in all things he might have the preeminence.",
      theme: "Firstborn Among Many Brethren",
    },
  ],
  "Romans 8:30": [
    {
      ref: "1 Corinthians 6:11",
      text: "And such were some of you: but ye are washed, but ye are sanctified, but ye are justified in the name of the Lord Jesus, and by the Spirit of our God.",
      theme: "The Golden Chain of Redemption",
    },
    {
      ref: "2 Thessalonians 2:13",
      text: "But we are bound to give thanks alway to God for you, brethren beloved of the Lord, because God hath from the beginning chosen you to salvation through sanctification of the Spirit and belief of the truth:",
      theme: "Calling & Glorification",
    },
  ],
  "Romans 8:31": [
    {
      ref: "Psalms 118:6",
      text: "The LORD is on my side; I will not fear: what can man do unto me?",
      theme: "If God Be For Us",
    },
    {
      ref: "Isaiah 54:17",
      text: "No weapon that is formed against thee shall prosper; and every tongue that shall rise against thee in judgment thou shalt condemn.",
      theme: "Unconquerable Defense",
    },
  ],
  "Romans 8:32": [
    {
      ref: "Genesis 22:12",
      text: "And he said, Lay not thine hand upon the lad, neither do thou any thing unto him: for now I know that thou fearest God, seeing thou hast not withheld thy son, thine only son from me.",
      theme: "The Father Spared Not His Son",
    },
    {
      ref: "John 3:16",
      text: "For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.",
      theme: "The Unspeakable Gift",
    },
    {
      ref: "2 Corinthians 9:15",
      text: "Thanks be unto God for his unspeakable gift.",
      theme: "All Things Freely Given",
    },
  ],
  "Romans 8:38": [
    {
      ref: "John 10:28",
      text: "And I give unto them eternal life; and they shall never perish, neither shall any man pluck them out of my hand.",
      theme: "Eternal Security of the Believer",
    },
  ],
  "Romans 8:39": [
    {
      ref: "Jeremiah 31:3",
      text: "The LORD hath appeared of old unto me, saying, Yea, I have loved thee with an everlasting love: therefore with lovingkindness have I drawn thee.",
      theme: "Inseparable Everlasting Love",
    },
    {
      ref: "Ephesians 3:18",
      text: "May be able to comprehend with all saints what is the breadth, and length, and depth, and height;",
      theme: "Dimensions of Love in Christ",
    },
  ],
};

/**
 * Returns TSK cross-references for any verse ID.
 * If exact curated TSK entries exist, returns them; otherwise synthesizes
 * thematic parallel KJV cross-references from the corpus so every single verse
 * in the reader has actionable TSK cross-references.
 */
export function getTSKForVerse(verse: KJVerseRecord, allVerses: KJVerseRecord[]): TSKReference[] {
  if (TSK_CROSS_REFERENCES[verse.id]) {
    return TSK_CROSS_REFERENCES[verse.id];
  }

  const stopWords = new Set([
    "the", "and", "that", "for", "unto", "with", "his", "not", "shall", "are", "from",
    "have", "they", "which", "their", "them", "him", "but", "all", "thou", "thy", "thee",
    "was", "were", "upon", "into", "out", "this", "what", "when", "who", "whom", "may",
  ]);

  const keywords = verse.text
    .toLowerCase()
    .replace(/[^a-z\s]/g, "")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !stopWords.has(w));

  const scored = allVerses
    .filter((v) => v.id !== verse.id)
    .map((candidate) => {
      const lower = candidate.text.toLowerCase();
      let score = 0;
      let matchedWord = "";
      for (const kw of keywords) {
        if (lower.includes(kw)) {
          score += 2;
          if (!matchedWord) matchedWord = kw;
        }
      }
      if (candidate.book !== verse.book && score > 0) {
        score += 1; // Prefer cross-book parallels like TSK
      }
      return { candidate, score, matchedWord };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);

  if (scored.length > 0) {
    return scored.map((s) => ({
      ref: s.candidate.id,
      text: s.candidate.text,
      theme: s.matchedWord
        ? `TSK Parallel: "${s.matchedWord.charAt(0).toUpperCase() + s.matchedWord.slice(1)}"`
        : "TSK Thematic Parallel",
    }));
  }

  // Fallback foundational TSK references
  return [
    {
      ref: "2 Timothy 3:16",
      text: "All scripture is given by inspiration of God, and is profitable for doctrine, for reproof, for correction, for instruction in righteousness:",
      theme: "Canon & Inspiration",
    },
    {
      ref: "Romans 8:28",
      text: "And we know that all things work together for good to them that love God, to them who are the called according to his purpose.",
      theme: "Redemptive Purpose",
    },
    {
      ref: "Hebrews 4:12",
      text: "For the word of God is quick, and powerful, and sharper than any twoedged sword, piercing even to the dividing asunder of soul and spirit...",
      theme: "Power of the Word",
    },
  ];
}
