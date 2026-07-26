using UnityEngine;

[DisallowMultipleComponent]
public sealed class StarterBootstrap : MonoBehaviour
{
    public const string ReadyObjectName = "__StarterReady";

    private void Awake()
    {
        if (transform.Find(ReadyObjectName) != null)
        {
            return;
        }

        GameObject readyObject = new GameObject(ReadyObjectName);
        readyObject.transform.SetParent(transform, false);
    }
}
