using NUnit.Framework;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

public sealed class StarterSceneTests
{
    private const string ScenePath = "Assets/Scenes/StarterScene.unity";

    [Test]
    public void StarterSceneContainsExpectedBaselineObjects()
    {
        Scene scene = EditorSceneManager.OpenScene(ScenePath, OpenSceneMode.Single);

        Assert.AreEqual("StarterScene", scene.name);
        Assert.IsNotNull(Object.FindFirstObjectByType<StarterBootstrap>());

        GameObject mainCamera = GameObject.FindWithTag("MainCamera");
        Assert.IsNotNull(mainCamera);
        Assert.IsNotNull(mainCamera.GetComponent<Camera>());

        GameObject starterObject = GameObject.Find("Starter Object");
        Assert.IsNotNull(starterObject);
        Assert.IsNotNull(starterObject.GetComponent<MeshRenderer>());
        Assert.IsNotNull(starterObject.GetComponent<BoxCollider>());
    }

    [Test]
    public void BootstrapReadyObjectNameIsStable()
    {
        Assert.AreEqual("__StarterReady", StarterBootstrap.ReadyObjectName);
    }
}
