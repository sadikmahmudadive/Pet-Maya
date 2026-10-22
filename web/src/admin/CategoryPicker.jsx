import { Link } from '../lib/router.jsx';
import { categoryLabel, pickerLevels } from '../lib/categories.js';

/**
 * Category choice for the product forms: one pick-list per level of the category tree
 * (Food → Cat food → Dry food). `value` is a category id; `onChange` gets the deepest id chosen.
 */
export default function CategoryPicker({ value, onChange, categories, invalid, legacyLabel }) {
  const levels = pickerLevels(value, categories);
  const pick = (levelIndex, id) => {
    // choosing "— none —" at a level goes back to the level above
    onChange(id || (levelIndex > 0 ? levels[levelIndex].parentId : ''));
  };
  return (
    <div className="stack gap-6" data-testid="category-picker">
      {levels.map((lv, i) => (
        <select
          key={lv.parentId || 'root'}
          className="select"
          value={lv.value}
          aria-invalid={invalid && i === 0 ? 'true' : undefined}
          aria-label={i === 0 ? 'Main category' : `Subcategory, level ${i}`}
          onChange={(e) => pick(i, e.target.value)}
        >
          <option value="">{i === 0 ? 'Choose a category…' : '— no subcategory —'}</option>
          {lv.options.map((o) => <option key={o.id} value={o.id}>{o.name}{o.active ? '' : ' (hidden)'}</option>)}
        </select>
      ))}
      <div className="sub" style={{ fontSize: 12 }}>
        {value ? <>Saved under <b>{categoryLabel(value, categories)}</b>. </> : legacyLabel ? <>Old label: “{legacyLabel}”. </> : null}
        <Link to="/admin/categories" className="link">Manage categories</Link>
      </div>
    </div>
  );
}
