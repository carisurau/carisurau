/* eslint-disable @typescript-eslint/no-misused-promises */
/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import {
  useForm,
  SubmitHandler,
  Controller,
  useFieldArray,
} from 'react-hook-form'
import { api } from '../utils/api'

const Select = dynamic(() => import('react-select'), {
  ssr: true,
})

type Inputs = {
  surauName: string
  state: string
  district: string
  mall: string
  is_qiblat_certified: boolean
  is_solat_certified: boolean
  test_optional_field: any
}

const FormHook = () => {
  const [loading, setLoading] = useState(false)
  const [choosenState, setChoosenState] = useState('')
  const [choosenDistrict, setChoosenDistrict] = useState('')

  const {
    handleSubmit,
    control,
    register,
    formState: { errors },
  } = useForm<Inputs>({
    mode: 'all',
    reValidateMode: 'onSubmit',
    defaultValues: {
      is_qiblat_certified: false,
      is_solat_certified: false,
    },
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'test',
  })

  useEffect(() => {
    remove(0)
  }, [remove])

  const state = api.surau.getState.useQuery()
  const district = state.data?.map((state) => state.districts).flat()
  const mall = api.surau.getMallOnDistrict.useQuery({
    district_id: choosenDistrict,
    state_id: choosenState,
  })
  const addSurau = api.surau.addSurau.useMutation()

  const handleNegeriChange = (e: any) => {
    setChoosenState(e.id)
    if (fields.length > 0) {
      remove(0)
    }
    append('district')
  }

  const handleDaerahChange = (e: any) => {
    setChoosenDistrict(e.id)
  }

  const onSubmit: SubmitHandler<Inputs> = (data) => alert(JSON.stringify(data))

  return (
    <div className='overflow-auto'>
      <div className='h-s md:grid md:grid-cols-2 md:gap-6'>
        <div className='md:col-span-1'>
          <div className='px-4 sm:px-0'>
            <h3 className='text-lg font-medium leading-6 text-gray-900'>
              Add surau
            </h3>
            <p className='mt-1 text-xs italic text-gray-600'>
              Help us to add surau if it is not in the list.
            </p>
          </div>
        </div>
        <div className='mt-4 md:col-span-2 md:mt-0'>
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className='shadow sm:overflow-hidden sm:rounded-md'>
              <div className='min-h-[500px] space-y-6 bg-white px-4 py-5 sm:p-6'>
                <div className='grid grid-cols-3 gap-6'>
                  <div className='col-span-3 sm:col-span-2'>
                    <label
                      htmlFor='surau-name'
                      className='block text-sm font-medium text-gray-700'
                    >
                      Surau Name
                    </label>

                    <div className='mt-1 rounded-md shadow-sm'>
                      <input
                        type='text'
                        className='block w-full flex-1 rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm'
                        {...register('surauName', { required: true })}
                      />
                    </div>
                    {errors.surauName && (
                      <p className='text-xs italic text-red-500'>
                        Surau name is required
                      </p>
                    )}
                  </div>
                </div>

                {/* Select State */}
                <div className='grid grid-cols-3 gap-6'>
                  <div className='col-span-3 sm:col-span-2'>
                    <label
                      htmlFor='state'
                      className='block text-sm font-medium text-gray-700'
                    >
                      State
                    </label>
                    <div className='relative z-20 mt-1 block w-full rounded-md shadow-sm'>
                      <Controller
                        name='state'
                        control={control}
                        rules={{ required: true }}
                        render={({ field }) => (
                          <Select
                            {...field}
                            options={state.data}
                            getOptionLabel={(option: any) => option.name}
                            getOptionValue={(option: any) => option.id}
                            onChange={(e) => handleNegeriChange(e)}
                          />
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* District */}
                {fields.map((f, i) => (
                  <div className='grid grid-cols-3 gap-6' key={i}>
                    <div className='col-span-3 sm:col-span-2'>
                      <label
                        htmlFor='district'
                        className='block text-sm font-medium text-gray-700'
                      >
                        District
                      </label>
                      <div className='relative mt-1 block w-full rounded-md shadow-sm'>
                        <Controller
                          name='district'
                          control={control}
                          rules={{ required: true }}
                          render={({ field }) => (
                            <Select
                              {...field}
                              options={district?.filter(
                                (d) => d.state_id === choosenState
                              )}
                              getOptionLabel={(option: any) => option.name}
                              getOptionValue={(option: any) => option.id}
                              onChange={(e) => handleDaerahChange(e)}
                            />
                          )}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className='flex flex-row items-end justify-end gap-2 px-4 py-3 text-right sm:px-6'>
              <input
                type='submit'
                className=' justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:cursor-pointer hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
              />
              <div className='mb-2 font-light underline'>Close</div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default FormHook
