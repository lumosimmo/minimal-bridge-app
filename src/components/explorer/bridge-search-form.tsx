import { useEffect, useId, useState } from 'react'
import { SearchIcon } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

import { addressPath, operationDetailPath } from '@/lib/routes'
import { Button } from '@/components/ui/button'
import {
  Field,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'

type BridgeSearchFormProps = {
  initialValue?: string
  compact?: boolean
}

export function BridgeSearchForm({
  initialValue = '',
  compact = false,
}: BridgeSearchFormProps) {
  const navigate = useNavigate()
  const inputId = useId()
  const [value, setValue] = useState(initialValue)
  const [error, setError] = useState('')

  useEffect(() => {
    setValue(initialValue)
  }, [initialValue])

  return (
    <form
      className="flex flex-col gap-2"
      onSubmit={(event) => {
        event.preventDefault()

        const trimmed = value.trim()
        if (!trimmed) {
          setError('Enter a bridge protocol address or destination address.')
          return
        }

        setError('')
        void navigate(
          trimmed.includes(':') ? operationDetailPath(trimmed) : addressPath(trimmed)
        )
      }}
    >
      <FieldGroup>
        <Field data-invalid={error ? true : undefined}>
          <FieldLabel
            htmlFor={inputId}
            className={compact ? 'sr-only' : undefined}
          >
            Address
          </FieldLabel>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              id={inputId}
              value={value}
              aria-invalid={error ? true : undefined}
              className="h-9 rounded-md border-border bg-card font-mono text-xs"
              placeholder="search address or operation id"
              onChange={(event) => setValue(event.target.value)}
            />
            <Button type="submit" className="h-9 rounded-md">
              <SearchIcon data-icon="inline-start" />
              Search
            </Button>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </Field>
      </FieldGroup>
    </form>
  )
}
