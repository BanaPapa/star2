// 선언적 스키마(tabSchemas.js)를 받아 Section + ConfigField로 렌더하는 제네릭 탭.
import { Section, NumberField, ToggleField, SelectField, TextField } from '../controls'

function Field(props) {
  switch (props.type) {
    case 'toggle': return <ToggleField {...props} />
    case 'select': return <SelectField {...props} />
    case 'text':   return <TextField {...props} />
    case 'number':
    default:       return <NumberField {...props} />
  }
}

export default function SchemaTab({ schema }) {
  return (
    <div className="scr-tabbody">
      {schema.sections.map((sec, i) => (
        <Section key={i} title={sec.title} desc={sec.desc}>
          <div className="scr-fieldgrid">
            {sec.fields.map((f) => <Field key={f.path} {...f} />)}
          </div>
        </Section>
      ))}
    </div>
  )
}
