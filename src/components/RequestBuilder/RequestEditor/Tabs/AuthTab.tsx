import React from 'react';
import { Input } from '@/components/ui/input';
import { getTokenExpiryDisplay } from '@/lib/request-utils';
import { collectionActions } from '@/store/collectionStore';
import { useRequestEditor } from '../context/RequestEditorContext';

const AuthTab = React.memo(
  ({
    preRequestEnabled,
    isCurrentRequestPreRequest,
    activeRequest,
  }: {
    preRequestEnabled: boolean;
    isCurrentRequestPreRequest: boolean;
    activeRequest?: any;
  }) => {
    const { authData, setAuthData, authType, activeRequestId } =
      useRequestEditor();

    console.log('token123:', authData);

    const handleTokenChange = React.useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newToken = e.target.value;
        setAuthData((prev) => ({ ...prev, token: newToken }));

        if (activeRequestId) {
          collectionActions.markUnsaved(activeRequestId);
          collectionActions.updateOpenedRequest({
            ...activeRequest,
            authorizationType: authType,
            authorization: { ...authData, token: newToken },
          });
        }
      },
      [activeRequestId, activeRequest, authType, authData, setAuthData],
    );

    return (
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h4 className='text-sm sm:text-lg font-medium text-gray-900 dark:text-white flex items-center gap-2'>
            Authorization
            {(() => {
              const expiry = getTokenExpiryDisplay(authData);
              if (!expiry) return null;
              const isExpired = expiry === 'Expired';
              return (
                <span
                  className={`text-sm font-normal ${isExpired ? 'text-red-500' : 'text-gray-500 dark:text-gray-400'}`}
                >
                  (Expires in: {expiry})
                </span>
              );
            })()}
          </h4>
          <select
            value='bearer'
            disabled
            className='border border-gray-300 dark:border-gray-600 rounded-md px-3 py-2 bg-white dark:bg-gray-800 text-sm font-medium focus:outline-none'
          >
            <option value='bearer'>Bearer Token</option>
          </select>
        </div>

        <div>
          <Input
            type='text'
            value={authData.token}
            onChange={handleTokenChange}
            placeholder='Enter token'
            disabled={preRequestEnabled && !isCurrentRequestPreRequest}
            className={
              preRequestEnabled && !isCurrentRequestPreRequest
                ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed'
                : ''
            }
          />
          {preRequestEnabled &&
            !isCurrentRequestPreRequest &&
            authData.token && (
              <p className='mt-1 text-xs text-gray-500 dark:text-gray-400'>
                Token loaded from collection's authentication request
              </p>
            )}
        </div>
      </div>
    );
  },
);

AuthTab.displayName = 'AuthTab';

export default AuthTab;
