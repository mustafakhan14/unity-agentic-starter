using System.Collections;
using NUnit.Framework;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.TestTools;

public sealed class StarterBootstrapPlayModeTests
{
    [UnityTest]
    public IEnumerator StarterSceneCreatesReadyMarker()
    {
        AsyncOperation loadOperation = SceneManager.LoadSceneAsync(
            "StarterScene",
            LoadSceneMode.Single);
        yield return loadOperation;
        yield return null;

        StarterBootstrap bootstrap = Object.FindFirstObjectByType<StarterBootstrap>();
        Assert.IsNotNull(bootstrap);
        Assert.IsNotNull(bootstrap.transform.Find(StarterBootstrap.ReadyObjectName));
    }
}
