import type { Subject } from '../types';
export interface RoyalMission { subject: Subject; title: string; q: string; choices: string[]; answer: string; hint: string; }
export const ROYAL_MISSIONS: RoyalMission[] = [
 {subject:'math',title:'Diamond fountain',q:'The princess has 3 gems. The prince gives her 2 more. How many gems now?',choices:['4','5','6'],answer:'5',hint:'Count three, then two more.'},
 {subject:'reading',title:'Storybook bridge',q:'Which word rhymes with crown?',choices:['down','tree','fish'],answer:'down',hint:'Crown and down have the same ending sound.'},
 {subject:'science',title:'Living garden',q:'What does a plant need to grow?',choices:['Water and sunlight','Candy and toys','Only darkness'],answer:'Water and sunlight',hint:'Think about what helps a seed become a plant.'},
 {subject:'writing',title:'Royal library',q:'Which sentence starts with a capital letter and ends with a period?',choices:['The prince reads.','the prince reads','The prince reads'],answer:'The prince reads.',hint:'Look for a capital T and a dot at the end.'},
 {subject:'socialStudies',title:'Kindness courtyard',q:'How can we help a friend who dropped their books?',choices:['Help pick them up','Laugh at them','Hide the books'],answer:'Help pick them up',hint:'Choose a kind action that helps someone.'},
 {subject:'art',title:'Rainbow pavilion',q:'What color can we make by mixing blue and yellow paint?',choices:['Green','Purple','Orange'],answer:'Green',hint:'Think of the color of the garden leaves.'},
 {subject:'music',title:'Rhythm terrace',q:'Which pattern repeats the same two beats?',choices:['Clap, tap, clap, tap','Clap, clap, tap, stomp','Tap, stomp, clap, clap'],answer:'Clap, tap, clap, tap',hint:'Look for clap and tap repeating in the same order.'},
 {subject:'speech',title:'Crystal speaking garden',q:'Which word begins with the same sound as sun?',choices:['Star','Moon','Leaf'],answer:'Star',hint:'Say sun and star slowly. Listen to the first sound.'},
 {subject:'africanHeritage',title:'Heritage palace',q:'Africa is a continent with many countries. Which is a country in Africa?',choices:['Ghana','Canada','Japan'],answer:'Ghana',hint:'Ghana is a country in West Africa. Our fantasy kingdom is imaginary.'},
];
