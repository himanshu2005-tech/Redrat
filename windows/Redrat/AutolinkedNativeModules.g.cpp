// AutolinkedNativeModules.g.cpp contents generated by "react-native autolink-windows"
// clang-format off
#include "pch.h"
#include "AutolinkedNativeModules.g.h"

// Includes from @react-native-community/slider
#include <winrt/SliderWindows.h>

// Includes from @react-native-picker/picker
#include <winrt/ReactNativePicker.h>

// Includes from react-native-linear-gradient
#include <winrt/BVLinearGradient.h>

// Includes from react-native-permissions
#include <winrt/RNPermissions.h>

// Includes from react-native-screens
#include <winrt/RNScreens.h>

// Includes from react-native-shared-element
#include <winrt/Visual.Clone.h>

// Includes from react-native-video
#include <winrt/ReactNativeVideoCPP.h>

// Includes from react-native-webview
#include <winrt/ReactNativeWebView.h>

namespace winrt::Microsoft::ReactNative
{

void RegisterAutolinkedNativeModulePackages(winrt::Windows::Foundation::Collections::IVector<winrt::Microsoft::ReactNative::IReactPackageProvider> const& packageProviders)
{ 
    // IReactPackageProviders from @react-native-community/slider
    packageProviders.Append(winrt::SliderWindows::ReactPackageProvider());
    // IReactPackageProviders from @react-native-picker/picker
    packageProviders.Append(winrt::ReactNativePicker::ReactPackageProvider());
    // IReactPackageProviders from react-native-linear-gradient
    packageProviders.Append(winrt::BVLinearGradient::ReactPackageProvider());
    // IReactPackageProviders from react-native-permissions
    packageProviders.Append(winrt::RNPermissions::ReactPackageProvider());
    // IReactPackageProviders from react-native-screens
    packageProviders.Append(winrt::RNScreens::ReactPackageProvider());
    // IReactPackageProviders from react-native-shared-element
    packageProviders.Append(winrt::Visual::Clone::ReactPackageProvider());
    // IReactPackageProviders from react-native-video
    packageProviders.Append(winrt::ReactNativeVideoCPP::ReactPackageProvider());
    // IReactPackageProviders from react-native-webview
    packageProviders.Append(winrt::ReactNativeWebView::ReactPackageProvider());
}

}
