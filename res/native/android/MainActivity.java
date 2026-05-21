/*
       Licensed to the Apache Software Foundation (ASF) under one
       or more contributor license agreements.  See the NOTICE file
       distributed with this work for additional information
       regarding copyright ownership.  The ASF licenses this file
       to you under the Apache License, Version 2.0 (the
       "License"); you may not use this file except in compliance
       with the License.  You may obtain a copy of the License at

         http://www.apache.org/licenses/LICENSE-2.0

       Unless required by applicable law or agreed to in writing,
       software distributed under the License is distributed on an
       "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
       KIND, either express or implied.  See the License for the
       specific language governing permissions and limitations
       under the License.
 */

package com.cr.competenciarobots;

import android.os.Bundle;

import androidx.core.view.WindowCompat;

import org.apache.cordova.*;

/**
 * Fuerza que el contenido respete barras del sistema (status / notch / gesture).
 * En targetSdk 35 Android puede imponer edge-to-edge; esto y Theme.CR.Main lo contrarrestan.
 */
public class MainActivity extends CordovaActivity
{
    private void applySystemBarInsets() {
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
    }

    @Override
    public void onCreate(Bundle savedInstanceState)
    {
        super.onCreate(savedInstanceState);

        Bundle extras = getIntent().getExtras();
        if (extras != null && extras.getBoolean("cdvStartInBackground", false)) {
            moveTaskToBack(true);
        }

        loadUrl(launchUrl);

        applySystemBarInsets();
        getWindow().getDecorView().post(this::applySystemBarInsets);
    }

    @Override
    public void onResume() {
        super.onResume();
        applySystemBarInsets();
        getWindow().getDecorView().post(this::applySystemBarInsets);
    }
}
