import standards from '../data/ncGrade1Standards.json';
import { CURRICULUM_1 } from '../data/curriculum1';
import { EXPEDITION_LESSONS } from '../data/expeditionCurriculum';
export function NCFirstGradeMap({onBack}:{onBack:()=>void}) {
  const lessons=[...CURRICULUM_1.flatMap(u=>u.lessons),...EXPEDITION_LESSONS];
  const areas=[...new Set(standards.map(s=>s.area))];
  return <div className="center card"><h1>North Carolina · Grade 1 learning map</h1><button className="btn" onClick={onBack}>Return to base</button>
    <p>Grade-specific standard codes from NC DPI’s 2025 quick reference guide. Lessons are introductory practice; a matching code does not mean the full standard is covered or mastered.</p>
    <p>Current first-grade ELA applies through 2026–27. The new ELA standards begin in 2027–28. Speech and African heritage are additional enrichment.</p>
    {areas.map(area=><section key={area}><h2>{area}</h2><div className="row" style={{flexWrap:'wrap'}}>{standards.filter(s=>s.area===area).map(s=><span className="pill" key={s.code}>{s.code} · {lessons.some(l=>l.standard===s.code)?'Introductory lesson':'Further lessons needed'}</span>)}</div></section>)}
    <p>Official reference: www.dpi.nc.gov → Standard Course of Study → Grade 1 Quick Reference Guide.</p>
  </div>;
}
