/* eslint-disable @typescript-eslint/restrict-plus-operands */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import dynamic from "next/dynamic";
import type { FC } from "react";
import { useEffect } from "react";
import React, { useState } from "react";

import Image from "next/image";
import { api } from "../utils/api";

import AlertModal from "./shared/AlertModal";
import type { District } from "@prisma/client";
import { UploadButton } from "../utils/uploadthing";
// You need to import our styles for the button to look right. Best to import in the root /_app.tsx but this is fine
import "@uploadthing/react/styles.css";
import FormHook from "./FormHook";

const Select = dynamic(() => import("react-select"), {
  ssr: true,
});
const AsyncCreatableSelect = dynamic(
  () => import("react-select/async-creatable"),
  {
    ssr: true,
  }
);

export type AddSurauFormProps = {
  setOpen: (open: boolean) => void;
};

export type FilePath = {
  file_path: string;
};

type UploadThingFilePath = {
  fileUrl: string;
  fileKey: string;
};

export type ImagePreviews = {
  id: string;
  url: string;
};

type MallOptions = {
  value: string;
  label: string;
  id: string;
};

const AddSurauForm: FC<AddSurauFormProps> = ({ setOpen }) => {
  const generateCombination = (): string => {
    const alphabet = "abcdefghijklmnopqrstuvwxyz";
    let combination = "";

    for (let i = 0; i < 3; i++) {
      const randomIndex = Math.floor(Math.random() * alphabet.length);
      const letter = alphabet[randomIndex];
      combination += letter;
    }

    return combination;
  };

  const [findMallChecked, setFindMallChecked] = useState(false);
  const [findMallForm, setFindMallForm] = useState(false);
  const [choosenState, setChoosenState] = useState("");
  const [choosenDistrict, setChoosenDistrict] = useState("");
  const [imagePreviews, setImagePreviews] = useState<ImagePreviews[]>();
  const [loading, setLoading] = useState(false);
  const [findMallLoading, setFindMallLoading] = useState(false);
  const [generatedSurauName, setGeneratedSurauName] = useState("");
  const [mallData, setMallData] = useState("");
  const [filePath, setFilePath] = useState<FilePath[]>([]);
  const [surauName, setSurauName] = useState("");
  const [briefDirection, setBriefDirection] = useState("");
  const [surauNameError, setSurauNameError] = useState("");
  const [briefDirectionError, setBriefDirectionError] = useState("");
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [currentDistrict, setCurrentDistrict] = useState<
    District[] | undefined
  >([]);
  const [isQiblatCertified, setIsQiblatCertified] = useState(false);
  const [isSolatJumaat, setIsSolatJumaat] = useState(false);
  const [latitude, setLatitude] = useState(0);
  const [longitude, setLongitude] = useState(0);
  const [qiblatDegree, setQiblatDegree] = useState(0);
  const [qiblatInfoError, setQiblatInfoError] = useState("");

  const state = api.surau.getState.useQuery();
  const district = state.data?.map((state) => state.districts).flat();
  const mall = api.surau.getMallOnDistrict.useQuery({
    district_id: choosenDistrict,
    state_id: choosenState,
  });
  const addSurau = api.surau.addSurau.useMutation();

  const handleNegeriChange = (e: any) => {
    setChoosenState(e.id);
    setCurrentDistrict([]);
    setFindMallForm(false);
    setFindMallChecked(false);
  };

  useEffect(() => {
    setCurrentDistrict(
      district?.filter((district) => district.state_id === choosenState)
    );
  }, [choosenState]);

  const handleDaerahChange = (e: any) => {
    setFindMallLoading(true);
    setFindMallForm(false);
    setFindMallChecked(false);
    setTimeout(() => {
      setFindMallLoading(false);
      setFindMallForm(true);
    }, 1000);

    setChoosenDistrict(e.id);
  };

  const transformSurauName = (name: string) => {
    setSurauName(name);
    const transformedSurauName = name.toLowerCase().replace(/ /g, "-");

    const randomString = generateCombination();
    const surauNameWithRandomString = `${transformedSurauName}-${randomString}`;

    setGeneratedSurauName(surauNameWithRandomString);
  };

  const handleMallChange = (e: any) => {
    if (e === null) return;
    setMallData(e.id);
  };

  const handleUploadThing = (uploadThingUrl: UploadThingFilePath[]) => {
    const images: ImagePreviews[] = [];
    const urls: FilePath[] = [];

    uploadThingUrl.forEach((url) => {
      urls.push({ file_path: url.fileUrl });
      images.push({ id: url.fileKey, url: url.fileUrl });
    });

    setFilePath(urls);
    setImagePreviews(images);
  };

  const filterMall = (inputValue: string) => {
    if (!mall.data) return [];
    return mall.data?.filter((i) =>
      i.value.toLowerCase().includes(inputValue.toLowerCase())
    );
  };

  const promiseOptions = (inputValue: string) =>
    new Promise<MallOptions[]>((resolve) => {
      setTimeout(() => {
        resolve(filterMall(inputValue));
      }, 1000);
    });

  const handleSubmit = (e: React.MouseEvent<HTMLButtonElement>) => {
    const qiblat = {
      latitude: latitude,
      longitude: longitude,
      degree: qiblatDegree,
    };

    e.preventDefault();

    if (surauName === "") {
      setSurauNameError("Surau name is required");
      return;
    }

    if (
      (qiblat.degree === 0 ||
        qiblat.latitude === 0 ||
        qiblat.longitude === 0) &&
      isQiblatCertified
    ) {
      setQiblatInfoError("Qiblat information is required");
      return;
    }

    if (briefDirection === "") {
      setBriefDirectionError("Brief direction is required");
      return;
    }

    addSurau
      .mutateAsync({
        name: surauName,
        brief_direction: briefDirection,
        unique_name: generatedSurauName,
        state_id: choosenState,
        district_id: choosenDistrict,
        mall_id: mallData,
        image: filePath,
        is_qiblat_certified: isQiblatCertified,
        is_solat_jumaat: isSolatJumaat,
        qiblat: {
          latitude: latitude,
          longitude: longitude,
          degree: qiblatDegree,
        },
      })
      .then(() => {
        setAlertModalOpen(true);
        setTimeout(() => {
          setAlertModalOpen(false);
          setOpen(false);
        }, 3000);
      })
      .catch((e) => {
        console.log(e);
      });
  };

  return (
    <>
      <AlertModal
        open={alertModalOpen}
        setOpen={setAlertModalOpen}
        message="Surau submitted, please wait for admin approval"
      />
      <div className="overflow-auto">
        <div className="md:grid md:grid-cols-2 md:gap-6">
          <div className="md:col-span-1">
            <div className="px-4 sm:px-0">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Add surau
              </h3>
              <p className="mt-1 text-xs italic text-gray-600">
                Help us to add surau if it is not in the list.
              </p>
            </div>
          </div>
          <div className="mt-4 md:col-span-2 md:mt-0">
            <div className="shadow sm:overflow-hidden sm:rounded-md">
              <div className="space-y-6 bg-white px-4 py-5 sm:p-6">
                <div className="grid grid-cols-3 gap-6">
                  <div className="col-span-3 md:col-span-2">
                    <label
                      htmlFor="surau-name"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Surau Name
                    </label>
                    <div className="mt-1 rounded-md shadow-sm">
                      <input
                        type="text"
                        name="surau-name"
                        id="surau-name"
                        className="block w-full flex-1 rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        placeholder=""
                        onChange={(e) => {
                          transformSurauName(e.target.value);
                        }}
                      />
                      {surauNameError ? (
                        <p className="text-xs italic text-red-500">
                          {surauNameError}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-6">
                  <div className="col-span-3 md:col-span-2">
                    <label
                      htmlFor="surau-name"
                      className="block text-sm font-medium text-gray-700"
                    >
                      State
                    </label>
                    <div className="relative z-20 mt-1 w-full rounded-md shadow-sm">
                      <Select
                        options={state.data}
                        getOptionLabel={(option: any) => option.name}
                        getOptionValue={(option: any) => option.id}
                        onChange={(e) => handleNegeriChange(e)}
                        required
                      />
                    </div>
                  </div>
                </div>
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="relative">
                      <div
                        className=" absolute h-4 w-4 rounded-full
                            border-4 border-solid border-gray-200"
                      ></div>
                      <div
                        className="absolute h-4 w-4 animate-spin rounded-full
                            border-4 border-solid border-green-500 border-t-transparent"
                      ></div>
                    </div>
                  </div>
                ) : null}

                {currentDistrict && currentDistrict.length > 0 ? (
                  <div>
                    <div className="grid grid-cols-3 gap-6">
                      <div className="col-span-3 md:col-span-2">
                        <label
                          htmlFor="surau-name"
                          className="block text-sm font-medium text-gray-700"
                        >
                          District
                        </label>
                        <div className="relative z-10 mt-1 block w-full rounded-md shadow-sm">
                          <Select
                            options={currentDistrict}
                            getOptionLabel={(option: any) => option.name}
                            getOptionValue={(option: any) => option.id}
                            onChange={(e) => handleDaerahChange(e)}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {findMallLoading ? (
                      <div className="mt-4 flex items-center justify-center">
                        <div className="relative">
                          <div
                            className=" absolute h-4 w-4 rounded-full
                            border-4 border-solid border-gray-200"
                          ></div>
                          <div
                            className="absolute h-4 w-4 animate-spin rounded-full
                            border-4 border-solid border-green-500 border-t-transparent"
                          ></div>
                        </div>
                      </div>
                    ) : null}

                    {!findMallLoading && findMallForm ? (
                      <>
                        <div className="mt-4 max-w-lg space-y-4">
                          <div className="relative flex items-start">
                            <div className="flex h-6 items-center">
                              <input
                                id="check-surau-mall"
                                name="check-surau-mall"
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                onChange={(e) => {
                                  setFindMallChecked(e.target.checked);
                                }}
                              />
                            </div>
                            <div className="ml-3 text-sm leading-6">
                              <p className="italic text-gray-500">
                                Check if your surau is inside a mall.
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 max-w-lg space-y-4">
                          <div className="relative flex items-start">
                            <div className="flex h-6 items-center">
                              <input
                                id="check-surau-qiblat"
                                name="check-surau-qiblat"
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                onChange={(e) =>
                                  setIsQiblatCertified(e.target.checked)
                                }
                              />
                            </div>
                            <div className="ml-3 text-sm leading-6">
                              <p className="italic text-gray-500">
                                This Surau is Qiblat certified.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 max-w-lg space-y-4">
                          <div className="relative flex items-start">
                            <div className="flex h-6 items-center">
                              <input
                                id="check-surau-qiblat"
                                name="check-surau-qiblat"
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                onChange={(e) =>
                                  setIsSolatJumaat(e.target.checked)
                                }
                              />
                            </div>
                            <div className="ml-3 text-sm leading-6">
                              <p className="italic text-gray-500">
                                This Surau perform Jumaah prayer.
                              </p>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : null}
                  </div>
                ) : null}

                {findMallChecked ? (
                  <div>
                    <AsyncCreatableSelect
                      isClearable
                      onChange={(e) => handleMallChange(e)}
                      loadOptions={promiseOptions}
                      cacheOptions
                      defaultOptions
                    />
                  </div>
                ) : null}

                {isQiblatCertified ? (
                  <div className="grid grid-cols-3 gap-2 md:gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Latitude
                      </label>
                      <div className="mt-1 rounded-md shadow-sm">
                        <input
                          type="number"
                          name="latitude"
                          id="latitude"
                          className="block w-full flex-1 rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="0.000"
                          onChange={(e) => {
                            setLatitude(parseFloat(e.target.value));
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Longitude
                      </label>
                      <div className="mt-1 rounded-md shadow-sm">
                        <input
                          type="number"
                          name="longitude"
                          id="longitude"
                          className="block w-full flex-1 rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="0.000"
                          onChange={(e) => {
                            setLongitude(parseFloat(e.target.value));
                          }}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Qiblat Degree
                      </label>
                      <div className="mt-1 rounded-md shadow-sm">
                        <input
                          type="text"
                          name="qiblat-degree"
                          id="longitude"
                          className="block w-full flex-1 rounded-md border-gray-300 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                          placeholder="0.000"
                          onChange={(e) => {
                            setQiblatDegree(parseFloat(e.target.value));
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ) : null}

                {qiblatInfoError ? (
                  <p className="text-xs italic text-red-500">
                    {qiblatInfoError}
                  </p>
                ) : null}

                <div>
                  <label
                    htmlFor="about"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Direction / guide
                  </label>
                  <div className="mt-1">
                    <textarea
                      id="about"
                      name="about"
                      rows={3}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                      defaultValue={""}
                      onChange={(e) => {
                        setBriefDirection(e.target.value);
                      }}
                    />
                  </div>
                  <p className="mt-2 text-sm italic text-gray-500">
                    Brief direction or guide to the surau. eg. near to the
                    mosque, near to the shop lot, etc.
                  </p>
                  {briefDirectionError ? (
                    <p className="text-xs italic text-red-500">
                      {briefDirectionError}
                    </p>
                  ) : null}
                </div>
                <div>
                  <div className="text-xs font-light italic text-center mb-2">
                    Upload image here
                  </div>
                  <UploadButton
                    endpoint="imageUploader"
                    onClientUploadComplete={(res) => {
                      // Do something with the response
                      alert("Upload Completed");
                      if (res) {
                        void handleUploadThing(res);
                      }
                    }}
                    onUploadError={(error: Error) => {
                      // Do something with the error.
                      alert(`ERROR! ${error.message}`);
                    }}
                  />
                </div>

                <div className="">
                  <div className="grid grid-cols-2 gap-2 space-y-2">
                    {imagePreviews
                      ? imagePreviews.map((imagePreview, index) => (
                          <div key={index}>
                            <Image
                              src={imagePreview.url}
                              alt="image preview"
                              sizes="100vw"
                              width={250}
                              height={250}
                            />
                          </div>
                        ))
                      : null}
                  </div>
                </div>
              </div>
              <div className="flex flex-row items-end justify-end gap-2 bg-gray-50 px-4 py-3 text-right sm:px-6">
                <button
                  onClick={(e) => handleSubmit(e)}
                  className=" justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Submit
                </button>
                <div
                  className="mb-2 font-light underline"
                  onClick={() => setOpen(false)}
                >
                  Close
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* <div>
        <FormHook />
      </div> */}
    </>
  );
};

export default AddSurauForm;
